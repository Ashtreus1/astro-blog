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
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false }); 

      if (error) {
        console.error('Failed to fetch tickets:', error);
      } else if (data) {
        setTickets(data);
      }
    };

    fetchTickets();

    const channel = supabase
      .channel('realtime:tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        payload => {
          setTickets(prev => {
            const { eventType, new: newTicket, old: oldTicket } = payload;

            switch (eventType) {
              case 'INSERT':
                // Prevent duplicate insertions
                if (!prev.some(t => t.id === newTicket.id)) {
                  return [newTicket, ...prev];
                }
                return prev;

              case 'UPDATE':
                return prev.map(t => t.id === newTicket.id ? newTicket : t);

              case 'DELETE':
                return prev.filter(t => t.id !== oldTicket.id);

              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
