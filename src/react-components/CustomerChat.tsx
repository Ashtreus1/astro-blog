'use client';

import { useEffect, useState } from 'react';
import MessageBox from './MessageBox';
import { supabase } from '@/lib/supabaseClient';

interface Ticket {
  id: string;
  name: string;
  issue: string;
  status: string;
}

export default function CustomerChat({ ticket }: { ticket: Ticket }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | ''>('');
  const [status, setStatus] = useState(ticket.status);
  const [initialLoad, setInitialLoad] = useState(false);

  // Load ticket info and messages
  useEffect(() => {
    const loadTicketData = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('priority, status')
        .eq('id', ticket.id)
        .single();

      if (!error && data) {
        setPriority(data.priority);
        setStatus(data.status);

        const { data: botMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: true });

        setMessages(botMessages || []);
        setInitialLoad(true);
      }
    };

    loadTicketData();
  }, [ticket.id]);

  // Subscribe to ticket status (if not Low)
  useEffect(() => {
    if (priority === 'Low') return;

    const ticketChannel = supabase
      .channel(`ticket-status-${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticket.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          if (newStatus && newStatus !== status) {
            setStatus(newStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
    };
  }, [ticket.id, status, priority]);

  // Subscribe to messages
  useEffect(() => {
    if (
      priority === 'Low' ||
      status === 'Assigned' ||
      status === 'Ongoing'
    ) {
      const messageChannel = supabase
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
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === payload.new.id);
              return exists ? prev : [...prev, payload.new];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
      };
    }
  }, [status, priority, ticket.id]);

  const appendMessage = (msg: any) => {
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 bg-blue-50">
        <h2 className="text-xl font-bold">{ticket.name}</h2>
        <p className="text-sm text-gray-600">
          {ticket.issue} – <span className="font-medium">{status}</span>
        </p>
      </div>

      {priority === 'Low' ? (
        !initialLoad ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Loading bot response...
          </div>
        ) : (
          <MessageBox
            ticketId={ticket.id}
            messages={messages}
            appendMessage={appendMessage}
            senderType="customer"
            priority={priority}
          />
        )
      ) : status !== 'Assigned' && status !== 'Ongoing' ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-lg italic px-6 text-center">
          Your ticket has been submitted. Please wait while we assign an agent.
        </div>
      ) : !initialLoad ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Loading chat...
        </div>
      ) : (
        <MessageBox
          ticketId={ticket.id}
          messages={messages}
          appendMessage={appendMessage}
          senderType="customer"
          priority={priority}
        />
      )}
    </div>
  );
}
