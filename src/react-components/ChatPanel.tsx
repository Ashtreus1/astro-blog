'use client';
import { useEffect, useState } from 'react';
import TicketSidebar from './TicketSidebar';
import MessageBox from './MessageBox';
import { supabase } from '@/lib/supabaseClient';

interface Ticket { id: string; name: string; issue: string; status: string; }

export default function ChatPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    supabase.from<Ticket>('tickets').select('*').then(({ data }) => {
      if (data) { setTickets(data); setSelected(data[0] ?? null); }
    });
    const ticketSub = supabase
      .channel('tickets')
      .on('postgres_changes',{ event: 'INSERT', schema: 'public', table: 'tickets' },
         (p) => setTickets((t) => [...t, p.new as Ticket])
      )
      .subscribe();
    return () => ticketSub.unsubscribe();
  }, []);

  useEffect(() => {
    if (!selected) return;
    supabase.from('messages').select('*').eq('ticket_id', selected.id).order('created_at',{ascending:true})
      .then(({ data }) => data && setMessages(data));
    const chan = supabase
      .channel(`messages-${selected.id}`)
      .on('postgres_changes',{ event: 'INSERT', schema: 'public', table: 'messages', filter: `ticket_id=eq.${selected.id}` },
         (p) => setMessages((m)=> [...m, p.new])
      )
      .subscribe();
    return () => chan.unsubscribe();
  }, [selected]);

  const appendMessage = (m:any) => setMessages((prev)=> [...prev, m]);

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
            <MessageBox ticketId={selected.id} messages={messages} appendMessage={appendMessage} senderType={"support"} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            No tickets yet.
          </div>
        )}
      </div>
    </div>
  );
}
