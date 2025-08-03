'use client';

import { useEffect, useState } from 'react';
import MessageBox from '@/react-components/MessageBox';
import OverdueTicketReport from '@/react-components/OverdueTicketReport';
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
  const [initialLoad, setInitialLoad] = useState(false);

  // Load messages and latest ticket info
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      setMessages(data || []);
      setInitialLoad(true);
    };

    load();
  }, [ticket.id]);

  // Subscribe to ticket status updates (skip Low priority)
  useEffect(() => {
    if (ticket.priority === 'Low') return;

    const chan = supabase
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

    return () => supabase.removeChannel(chan);
  }, [ticket.id, ticket.priority, status]);

  // Subscribe to new messages
  useEffect(() => {
    if (
      ticket.priority === 'Low' ||
      status === 'Assigned' ||
      status === 'Ongoing'
    ) {
      const chan = supabase
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

      return () => supabase.removeChannel(chan);
    }
  }, [ticket.id, ticket.priority, status]);

  // const appendMessage = (m: any) => setMessages((prev) => [...prev, m]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 bg-blue-50">
        <h2 className="text-xl font-bold">{ticket.name}</h2>
        <p className="text-sm text-gray-600">
          {ticket.issue} – <span className="font-medium">{status}</span>
        </p>
      </div>

      {ticket.priority === 'Low' ? (
        !initialLoad ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Loading bot response...
          </div>
        ) : (
          <MessageBox
            ticketId={ticket.id}
            messages={messages}
            appendMessage={() => {}}
            senderType="customer"
            priority={ticket.priority}
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
          appendMessage={() => {}}
          senderType="customer"
          priority={ticket.priority}
        />
      )}

      <OverdueTicketReport customerId={ticket.customer_id} />
    </div>
  );
}
