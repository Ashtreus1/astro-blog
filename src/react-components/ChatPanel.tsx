'use client';

import { useEffect, useState } from 'react';
import TicketSidebar from '@/react-components/TicketSidebar';
import MessageBox from '@/react-components/MessageBox';
import { supabase } from '@/lib/supabaseClient';
import { useFetchTickets } from '@/hooks/useFetchTickets';
import type { Ticket } from '@/hooks/useFetchTickets';

export default function ChatPanel({ agentId }: { agentId: string }) {
  const tickets = useFetchTickets(agentId);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!selected) return;

    let isMounted = true;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', selected.id)
        .order('created_at', { ascending: true });

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

  return (
    <div className="flex h-full">
      <TicketSidebar tickets={tickets} selected={selected} onSelect={setSelected} />
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="border-b p-4">
              <h2 className="text-xl font-bold">{selected.name}</h2>
              <p className="text-sm">{`${selected.issue} – ${selected.status}`}</p>
            </div>
            <MessageBox
              ticketId={selected.id}
              messages={messages}
              appendMessage={() => {}}
              senderType="support"
              priority={selected.priority}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            No assigned tickets yet.
          </div>
        )}
      </div>
    </div>
  );
}
