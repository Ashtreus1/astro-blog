'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Ticket {
  id: string;
  name: string;
  issue: string;
  status: string;
}

interface Props {
  selected: Ticket | null;
  onSelect: (ticket: Ticket) => void;
}

export default function TicketSidebar({ selected, onSelect }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    supabase.from<Ticket>('tickets').select('*').then(r => {
      if (!r.error && r.data) setTickets(r.data);
    });

    const sub = supabase
      .channel('tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, payload => {
        setTickets(prev => {
          switch (payload.eventType) {
            case 'INSERT': return [...prev, payload.new];
            case 'UPDATE': return prev.map(t => t.id === payload.new.id ? payload.new : t);
            case 'DELETE': return prev.filter(t => t.id !== payload.old.id);
            default: return prev;
          }
        });
      })
      .subscribe();

    return () => void supabase.removeChannel(sub);
  }, []);

  return (
    <aside className="w-1/4 border-r overflow-y-auto h-full">
      <ul>
        {tickets.map(ticket => (
          <li key={ticket.id}>
            <button
              onClick={() => onSelect(ticket)}
              className={`w-full text-left p-4 hover:bg-gray-100 ${
                selected?.id === ticket.id ? 'bg-blue-100' : ''
              }`}
            >
              <div className="font-semibold">{ticket.name}</div>
              <div className="text-sm">{ticket.issue}</div>
              <div className="text-xs text-gray-500">{ticket.status}</div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
