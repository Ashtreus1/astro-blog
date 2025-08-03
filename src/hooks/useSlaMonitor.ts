import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useSlaMonitor() {
  useEffect(() => {
    const checkTickets = async () => {
      const now = new Date().toISOString();

      const { data: tickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('status', 'open');

      if (!tickets) return;

      for (const ticket of tickets) {
        if (
          ticket.priority.toLowerCase() === 'low' &&
          ticket.status === 'open' &&
          !ticket.agent_id
        ) {
          // Low-priority handled by bot — skip
          continue;
        }

        const createdAt = new Date(ticket.created_at).getTime();
        const nowMs = new Date().getTime();
        const due = createdAt + ticket.response_time_seconds * 1000;

        if (nowMs > due) {
          await supabase
            .from('tickets')
            .update({ status: 'overdue' })
            .eq('id', ticket.id);
        }
      }
    };

    checkTickets();

    const interval = setInterval(checkTickets, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, []);
}
