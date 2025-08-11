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
  const [initialLoad, setInitialLoad] = useState(false);

  // Load all existing messages and subscribe
  useEffect(() => {
    let messageChannel: any;
    let statusChannel: any;

    const init = async () => {
      // 1️⃣ Fetch existing messages first (includes any bot reply)
      const { data: initialMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (!error) {
        setMessages(initialMessages || []);
      }
      setInitialLoad(true);

      // 2️⃣ Subscribe to ticket status updates (skip for low priority)
      if (ticket.priority !== 'Low') {
        statusChannel = supabase
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
      }

      // 3️⃣ Subscribe to new messages (after fetching existing ones)
      if (
        ticket.priority === 'Low' ||
        status === 'Assigned' ||
        status === 'Ongoing'
      ) {
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
              setMessages((prev) => {
                const exists = prev.some((m) => m.id === payload.new.id);
                return exists ? prev : [...prev, payload.new];
              });
            }
          )
          .subscribe();
      }
    };

    init();

    // Cleanup
    return () => {
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (statusChannel) supabase.removeChannel(statusChannel);
    };
  }, [ticket.id, ticket.priority, status]);

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

      {status === 'resolved' && (
        <FeedbackReport
          ticketId={ticket.id}
          customerId={ticket.customer_id}
        />
      )}

      <OverdueTicketReport customerId={ticket.customer_id} />
    </div>
  );
}
