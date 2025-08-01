import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Ticket {
  id: string;
  name: string;
  issue: string;
  status: string;
  priority: string;
}

export const useFetchTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .neq('priority', 'low')
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
          const { eventType, new: newTicket, old: oldTicket } = payload;

          setTickets(prev => {
            switch (eventType) {
              case 'INSERT':
                if (newTicket.priority !== 'low' && !prev.some(t => t.id === newTicket.id)) {
                  return [newTicket, ...prev];
                }
                return prev;

              case 'UPDATE':
                if (newTicket.priority === 'low') {
                  return prev.filter(t => t.id !== newTicket.id);
                }
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

  return tickets;
};
