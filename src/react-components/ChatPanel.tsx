'use client';

import { useEffect, useState, useRef } from 'react';
import TicketSidebar from '@/react-components/TicketSidebar';
import MessageBox from '@/react-components/MessageBox';
import { supabase } from '@/lib/supabaseClient';
import { useFetchTickets } from '@/hooks/useFetchTickets';
import type { Ticket } from '@/hooks/useFetchTickets';
import { Button } from '@/components/ui/button';

function formatTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Get SLA limit in seconds based on priority
function getSlaLimit(priority: string): number {
  switch (priority.toLowerCase()) {
    case 'high':
      return 24 * 60 * 60; // 1 day
    case 'medium':
      return 48 * 60 * 60; // 2 days
    case 'low':
      return 0; // No limit for bot-handled tickets
    default:
      return 48 * 60 * 60; // Default to medium
  }
}

export default function ChatPanel({ agentId }: { agentId: string }) {
  const tickets = useFetchTickets(agentId);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [resolutionTime, setResolutionTime] = useState<number>(0);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate current resolution time
  const calculateResolutionTime = (ticket: Ticket): number => {
    if (ticket.status === 'resolved' && ticket.resolution_time_seconds) {
      return ticket.resolution_time_seconds;
    }
    
    const createdAt = new Date(ticket.created_at).getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.floor((now - createdAt) / 1000);
    
    // Cap at SLA limit if not Low priority
    const slaLimit = getSlaLimit(ticket.priority);
    return slaLimit > 0 ? Math.min(elapsedSeconds, slaLimit) : elapsedSeconds;
  };

  // Check if ticket is overdue
  const isOverdue = (ticket: Ticket): boolean => {
    if (ticket.status === 'resolved' || ticket.priority.toLowerCase() === 'low') {
      return false;
    }
    
    const createdAt = new Date(ticket.created_at).getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.floor((now - createdAt) / 1000);
    const slaLimit = getSlaLimit(ticket.priority);
    
    return elapsedSeconds > slaLimit;
  };

  // Get remaining time
  const getRemainingTime = (ticket: Ticket): number => {
    if (ticket.status === 'resolved' || ticket.priority.toLowerCase() === 'low') {
      return 0;
    }
    
    const createdAt = new Date(ticket.created_at).getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.floor((now - createdAt) / 1000);
    const slaLimit = getSlaLimit(ticket.priority);
    
    return Math.max(0, slaLimit - elapsedSeconds);
  };

  // Start/stop resolution time tracking
  useEffect(() => {
    if (selected && selected.status !== 'resolved' && selected.priority.toLowerCase() !== 'low') {
      // Update resolution time every second
      timerIntervalRef.current = setInterval(() => {
        const currentTime = calculateResolutionTime(selected);
        setResolutionTime(currentTime);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [selected]);

  // Update resolution time in database every 10 seconds
  useEffect(() => {
    if (selected && selected.status !== 'resolved') {
      const updateResolutionTime = async () => {
        const currentTime = calculateResolutionTime(selected);
        
        const { error } = await supabase
          .from('tickets')
          .update({ resolution_time_seconds: currentTime })
          .eq('id', selected.id);

        if (error) {
          console.error('Failed to update resolution time:', error);
        }
      };

      // Update immediately
      updateResolutionTime();

      // Then update every 10 seconds
      updateIntervalRef.current = setInterval(updateResolutionTime, 10000);
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [selected]);

  // Initialize resolution time when ticket is selected
  useEffect(() => {
    if (selected) {
      setResolutionTime(calculateResolutionTime(selected));
    }
  }, [selected]);

  // Fetch messages and subscribe to new ones
  useEffect(() => {
    if (!selected) return;

    let isMounted = true;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', selected.id)
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error);
      if (isMounted) setMessages(data || []);
    };

    fetchMessages();

    const chan = supabase
      .channel(`messages-${selected.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${selected.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id);
            return exists ? prev : [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(chan);
    };
  }, [selected]);

  const handleResolve = async () => {
    if (!selected) return;

    const resolvedAt = new Date().toISOString();
    const finalResolutionTime = calculateResolutionTime(selected);

    const { data, error } = await supabase
      .from('tickets')
      .update({
        status: 'resolved',
        resolved_at: resolvedAt,
        resolution_time_seconds: finalResolutionTime
      })
      .eq('id', selected.id)
      .select();

    if (error) {
      console.error('Failed to resolve ticket:', error);
      alert('Failed to resolve ticket: ' + error.message);
      return;
    }

    setSelected((prev) =>
      prev
        ? {
            ...prev,
            status: 'resolved',
            resolved_at: resolvedAt,
            resolution_time_seconds: finalResolutionTime
          }
        : prev
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return 'text-emerald-600';
      case 'ongoing': return 'text-purple-600';
      case 'assigned': return 'text-blue-600';
      default: return 'text-amber-600';
    }
  };

  return (
    <div className="flex h-full bg-white">
      <TicketSidebar tickets={tickets} selected={selected} onSelect={setSelected} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            {/* Modern Header */}
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-lg font-semibold text-gray-900 truncate">
                      {selected.name}
                    </h1>
                    <div className="flex items-center gap-2">
                      <p className="text-lg text-gray-600 line-clamp-1 font-bold">
                        {selected.issue}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py- text-xs font-medium rounded-full ${getPriorityColor(selected.priority)}`}>
                        {selected.priority}
                      </span>
                      <span className={`text-xs font-medium ${getStatusColor(selected.status)}`}>
                        {selected.status}
                      </span>
                </div>
                
                {selected.status !== 'resolved' && (
                  <Button 
                    onClick={handleResolve} 
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Resolve
                  </Button>
                )}
              </div>

              {/* SLA Timer - Redesigned */}
              {selected.priority.toLowerCase() !== 'low' && selected.status !== 'resolved' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        isOverdue(selected) ? 'bg-red-500 animate-pulse' :
                        getRemainingTime(selected) < 3600 ? 'bg-amber-500 animate-pulse' :
                        'bg-emerald-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Resolution Timer
                        </p>
                        <p className="text-xs text-gray-500">
                          Working: {formatTime(resolutionTime)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        isOverdue(selected) ? 'text-red-600' :
                        getRemainingTime(selected) < 3600 ? 'text-amber-600' :
                        'text-emerald-600'
                      }`}>
                        {isOverdue(selected) 
                          ? `Overdue by ${formatTime(resolutionTime - getSlaLimit(selected.priority))}`
                          : `${formatTime(getRemainingTime(selected))} remaining`
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {selected.priority} priority SLA
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bot Ticket Notice - Redesigned */}
              {selected.priority.toLowerCase() === 'low' && selected.status !== 'resolved' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Automated Support
                      </p>
                      <p className="text-xs text-blue-700">
                        This ticket is handled by our AI assistant
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resolved Status - Redesigned */}
              {selected.status === 'resolved' && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-900">
                        Ticket Resolved
                      </p>
                      <p className="text-xs text-emerald-700">
                        Total time: {formatTime(selected.resolution_time_seconds || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Area */}
            <MessageBox
              ticketId={selected.id}
              messages={messages}
              appendMessage={() => {}}
              senderType="support"
              priority={selected.priority}
              disabled={selected.status === 'resolved'}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a ticket
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Choose a ticket from the sidebar to start the conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}