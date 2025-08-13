'use client';

import { useEffect, useState } from 'react';
import MessageBox from '@/react-components/MessageBox';
import OverdueTicketReport from '@/react-components/OverdueTicketReport';
import FeedbackReport from '@/react-components/FeedbackReport';
import { supabase } from '@/lib/supabaseClient';

interface Ticket {
  id: string;
  name: string;
  issue: string;
  status: string;
  customer_id: string;
  priority: 'Low' | 'Medium' | 'High';
}

export default function CustomerChat({ ticket }: { ticket: Ticket }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [initialLoad, setInitialLoad] = useState(false);

  const appendMessage = (newMessage: any) => {
    setMessages((prev) => {
      const exists = prev.some(
        (m) =>
          m.content === newMessage.content &&
          m.sender === newMessage.sender &&
          Math.abs(
            new Date(m.created_at).getTime() -
              new Date(newMessage.created_at).getTime()
          ) < 5000
      );
      return exists ? prev : [...prev, newMessage];
    });
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
  };

  useEffect(() => {
    let messageChannel: any;
    let statusChannel: any;

    const init = async () => {
      const { data: initialMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      setMessages(initialMessages || []);

      const { data: ticketData } = await supabase
        .from('tickets')
        .select('status, priority')
        .eq('id', ticket.id)
        .single();

      if (ticketData) {
        setStatus(ticketData.status);
        setPriority(ticketData.priority);
      }

      setInitialLoad(true);

      statusChannel = supabase
        .channel(`ticket-updates-${ticket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tickets',
            filter: `id=eq.${ticket.id}`,
          },
          (payload) => {
            if (payload.new.status && payload.new.status !== status) {
              setStatus(payload.new.status);
            }
            if (payload.new.priority && payload.new.priority !== priority) {
              setPriority(payload.new.priority);
            }
          }
        )
        .subscribe();

      if (status !== 'resolved') {
        messageChannel = supabase
          .channel(`messages-${ticket.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `ticket_id=eq.${ticket.id}`,
            },
            (payload) => {
              appendMessage(payload.new);
            }
          )
          .subscribe();
      }
    };

    init();

    return () => {
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (statusChannel) supabase.removeChannel(statusChannel);
    };
  }, [ticket.id]);

  useEffect(() => {
    if (status !== 'resolved' && initialLoad) {
      const messageChannel = supabase
        .channel(`messages-${ticket.id}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `ticket_id=eq.${ticket.id}`,
          },
          (payload) => {
            appendMessage(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
      };
    }
  }, [status, initialLoad, ticket.id]);

  const getStatusColor = (ticketStatus: string) => {
    switch (ticketStatus) {
      case 'Open': return 'text-amber-600';
      case 'Assigned': return 'text-blue-600';
      case 'Ongoing': return 'text-purple-600';
      case 'resolved': return 'text-emerald-600';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (ticketPriority: string) => {
    switch (ticketPriority) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-orange-500';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusDot = (ticketStatus: string) => {
    switch (ticketStatus) {
      case 'Open': return 'bg-amber-400';
      case 'Assigned': return 'bg-blue-500';
      case 'Ongoing': return 'bg-purple-500 animate-pulse';
      case 'resolved': return 'bg-emerald-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Minimalist Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-medium text-gray-900 truncate">
              {ticket.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {ticket.issue}
            </p>
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            {/* Priority Indicator */}
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(priority).replace('text-', 'bg-')}`} />
              <span className={`text-xs font-medium ${getPriorityColor(priority)}`}>
                {priority}
              </span>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${getStatusDot(status)}`} />
              <span className={`text-xs font-medium ${getStatusColor(status)}`}>
                {status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {!initialLoad ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading conversation</span>
            </div>
          </div>
        ) : status !== 'Assigned' && status !== 'Ongoing' && status !== 'resolved' && priority !== 'Low' ? (
          <div className="h-full flex items-center justify-center px-6">
            <div className="text-center max-w-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Waiting for assignment
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your ticket is in the queue and will be assigned to an agent soon
              </p>
            </div>
          </div>
        ) : (
          <MessageBox
            ticketId={ticket.id}
            messages={messages}
            appendMessage={appendMessage}
            senderType="customer"
            priority={priority}
            currentStatus={status}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {/* Footer Components */}
      {status === 'resolved' && (
        <div className="border-t border-gray-100">
          <FeedbackReport
            ticketId={ticket.id}
            customerId={ticket.customer_id}
          />
        </div>
      )}

      <OverdueTicketReport customerId={ticket.customer_id} />
    </div>
  );
}