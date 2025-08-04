import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient';

type Ticket = {
  status: string;
  priority: string;
  response_time_seconds: number;
  resolution_time_seconds: number;
  created_at: string;
  resolved_at: string | null;
};

export default function SlaReport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('status, priority, response_time_seconds, resolution_time_seconds, created_at, resolved_at');

      if (!error && data) setTickets(data);
      setLoading(false);
    };

    fetchTickets();
  }, []);

  if (loading) return <div className="p-4 text-gray-500">Loading SLA Report...</div>;

  const resolvedTickets = tickets.filter(t => t.resolved_at !== null);
  const slaMetTickets = resolvedTickets.filter(t => t.resolution_time_seconds <= 86400); // 24 hours
  const avgResponse = Math.round(
    tickets.reduce((sum, t) => sum + t.response_time_seconds, 0) / tickets.length
  );
  const avgResolution = Math.round(
    resolvedTickets.reduce((sum, t) => sum + t.resolution_time_seconds, 0) / resolvedTickets.length
  );

  const performanceByPriority = ['High', 'Medium', 'Low'].map(priority => {
    const group = tickets.filter(t => t.priority === priority);
    const met = group.filter(t => t.resolved_at && t.resolution_time_seconds <= 86400);
    const avgResTime = Math.round(
      group.reduce((sum, t) => sum + t.resolution_time_seconds, 0) / (group.length || 1)
    );
    const avgRespTime = Math.round(
      group.reduce((sum, t) => sum + t.response_time_seconds, 0) / (group.length || 1)
    );

    return {
      priority,
      percentMet: group.length ? Math.round((met.length / group.length) * 100) : 0,
      avgResolution: avgResTime,
      avgResponse: avgRespTime,
    };
  });

  return (
    <div className="grid gap-6 p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">SLA Report</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-500 text-sm">Total Tickets</p>
            <p className="text-2xl font-semibold">{tickets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-500 text-sm">% SLA Met</p>
            <p className="text-2xl font-semibold">
              {tickets.length ? Math.round((slaMetTickets.length / tickets.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-500 text-sm">Avg. Response Time</p>
            <p className="text-2xl font-semibold">{avgResponse}s</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-500 text-sm">Avg. Resolution Time</p>
            <p className="text-2xl font-semibold">{avgResolution}s</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white shadow-sm rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Performance by Priority</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceByPriority}>
            <XAxis dataKey="priority" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="percentMet" fill="#60a5fa" name="% SLA Met" />
            <Bar dataKey="avgResponse" fill="#34d399" name="Avg. Response (s)" />
            <Bar dataKey="avgResolution" fill="#fbbf24" name="Avg. Resolution (s)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
