'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AssignTicketModal() {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('status', 'open')
        .is('agent_id', null);

      const filtered = data?.filter(
        (t) => t.priority.toLowerCase() !== 'low'
      ) ?? [];

      setTickets(filtered);
    };

    fetch();
  }, []);

  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <h2 className="text-lg font-bold">Pending Tickets (Unassigned)</h2>
      {tickets.length === 0 ? (
        <p className="text-sm text-gray-500">No pending tickets.</p>
      ) : (
        <ul className="space-y-2">
          {tickets.map((t) => (
            <li key={t.id} className="border p-2 rounded">
              <div className="font-semibold">{t.issue}</div>
              <div className="text-sm text-gray-600">Priority: {t.priority}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
