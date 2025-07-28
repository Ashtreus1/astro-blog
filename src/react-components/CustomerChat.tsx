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

  useEffect(() => {
    const loadTicketData = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('priority')
        .eq('id', ticket.id)
        .single();

      if(!error && data){
        setPriority(data.priority);
      }
    }

    loadTicketData();
  }, [ticket.id])

  useEffect(() => {
    supabase.from('messages').select('*').eq('ticket_id', ticket.id).order('created_at',{ascending:true})
      .then(({ data }) => data && setMessages(data));
    const chan = supabase
      .channel(`messages-${ticket.id}`)
      .on('postgres_changes',{ event: 'INSERT', schema: 'public', table: 'messages', filter: `ticket_id=eq.${ticket.id}` },
         (p) => setMessages((m)=> [...m, p.new])
      )
      .subscribe();
    return () => chan.unsubscribe();
  }, [ticket.id]);

  const appendMessage = (m:any) => setMessages((prev)=> [...prev, m]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 bg-blue-50">
        <h2 className="text-xl font-bold">{ticket.name}</h2>
        <p className="text-sm">{`${ticket.issue} – ${ticket.status}`}</p>
      </div>
      <MessageBox ticketId={ticket.id} messages={messages} appendMessage={appendMessage} senderType={'customer'} priority={priority} />
    </div>
  );
}
