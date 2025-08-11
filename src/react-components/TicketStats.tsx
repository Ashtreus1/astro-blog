'use client'

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TicketStats() {
  const [stats, setStats] = useState([
    { title: 'Resolved', count: 0 },
    { title: 'Overdue', count: 0 },
    { title: 'Unassigned', count: 0 },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: all, error } = await supabase.from('tickets').select('*');
      if (error) {
        console.error("Failed to fetch ticket stats:", error.message);
        return;
      }

      const resolved = all?.filter((t) => t.status.toLowerCase() === 'resolved').length ?? 0;
      const overdue = all?.filter((t) => t.status.toLowerCase() === 'overdue').length ?? 0;
      const unassigned = all?.filter(
        (t) =>
          !t.agent_id &&
          t.status.toLowerCase() === 'Open' &&
          t.priority?.toLowerCase() !== 'low'
      ).length ?? 0;

      setStats([
        { title: 'Resolved', count: resolved },
        { title: 'Overdue', count: overdue },
        { title: 'Unassigned', count: unassigned },
      ]);
    };

    fetchStats();

    const channel = supabase
      .channel('ticket-stats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tickets',
      }, (payload) => {
        fetchStats();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      {stats.map((s) => (
        <div key={s.title} className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold">{s.title}</h2>
          <p className="text-xl font-bold">{s.count.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
