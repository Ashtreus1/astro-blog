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

  return (
    <div className="flex h-full">
      <TicketSidebar tickets={tickets} selected={selected} onSelect={setSelected} />
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="border-b p-4 flex justify-between items-center">
              <div className="flex-1">
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <p className="text-sm text-gray-600">{`${selected.issue} – ${selected.status}`}</p>
                
                {/* Priority Badge */}
                <div className="mt-2 flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    selected.priority.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
                    selected.priority.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    Priority: {selected.priority}
                  </span>
                </div>

                {/* SLA Timer Display - Only show for High/Medium priority */}
                {selected.priority.toLowerCase() !== 'low' && selected.status !== 'resolved' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Resolution Time Tracking
                        </p>
                        <p className="text-xs text-blue-700">
                          Working: {formatTime(resolutionTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          isOverdue(selected) ? 'text-red-600' :
                          getRemainingTime(selected) < 3600 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {isOverdue(selected) 
                            ? `⚠️ OVERDUE`
                            : `${formatTime(getRemainingTime(selected))} left`
                          }
                        </p>
                        {isOverdue(selected) && (
                          <p className="text-xs text-red-500">
                            by {formatTime(resolutionTime - getSlaLimit(selected.priority))}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Low Priority Notice */}
                {selected.priority.toLowerCase() === 'low' && selected.status !== 'resolved' && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700">
                      🤖 Bot-Handled Ticket
                    </p>
                    <p className="text-xs text-gray-600">
                      No SLA time limit applies
                    </p>
                  </div>
                )}

                {/* Resolved Status */}
                {selected.status === 'resolved' && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900">
                      ✅ Ticket Resolved
                    </p>
                    <p className="text-xs text-green-700">
                      Total resolution time: {formatTime(selected.resolution_time_seconds || 0)}
                    </p>
                  </div>
                )}
              </div>
              
              {selected.status !== 'resolved' && (
                <Button onClick={handleResolve} variant="outline" className="ml-4">
                  Resolve Ticket
                </Button>
              )}
            </div>
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
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No ticket selected</p>
              <p className="text-sm">Select a ticket from the sidebar to start working</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}