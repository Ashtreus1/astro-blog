'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

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
        .select(
          'status, priority, response_time_seconds, resolution_time_seconds, created_at, resolved_at'
        );

      if (!error && data) setTickets(data);
      setLoading(false);
    };

    fetchTickets();
  }, []);

  if (loading) return <div className="p-4 text-muted-foreground">Loading SLA Report...</div>;

  const resolvedTickets = tickets.filter((t) => t.resolved_at !== null);
  const slaMetTickets = resolvedTickets.filter(
    (t) => t.resolution_time_seconds <= 86400
  );
  const avgResponse = Math.round(
    tickets.reduce((sum, t) => sum + t.response_time_seconds, 0) / tickets.length
  );
  const avgResolution = Math.round(
    resolvedTickets.reduce((sum, t) => sum + t.resolution_time_seconds, 0) /
      resolvedTickets.length
  );

  const performanceByPriority = ['High', 'Medium', 'Low'].map((priority) => {
    const group = tickets.filter((t) => t.priority === priority);
    const met = group.filter(
      (t) => t.resolved_at && t.resolution_time_seconds <= 86400
    );
    const avgResTime = Math.round(
      group.reduce((sum, t) => sum + t.resolution_time_seconds, 0) /
        (group.length || 1)
    );
    const avgRespTime = Math.round(
      group.reduce((sum, t) => sum + t.response_time_seconds, 0) /
        (group.length || 1)
    );

    return {
      priority,
      percentMet: group.length ? Math.round((met.length / group.length) * 100) : 0,
      avgResolution: avgResTime,
      avgResponse: avgRespTime,
    };
  });

  return (
    <div className="p-6">
      <div className="p-6 w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-5xl font-semibold mb-3">SLA Report</h2>
            <p className="text-sm text-muted-foreground">Some description here...</p>
          </div>

          <div className="w-[220px]">
            <Select defaultValue="priority">
              <SelectTrigger>
                <SelectValue placeholder="Performance by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Performance by Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-full">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={250}>
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

          <div className="flex flex-col gap-4 w-full lg:w-[220px]">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">% SLA Met</p>
                <p className="text-xl font-semibold">
                  {tickets.length ? Math.round((slaMetTickets.length / tickets.length) * 100) : 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                <p className="text-xl font-semibold">{avgResponse}s</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Avg. Resolution Time</p>
                <p className="text-xl font-semibold">{avgResolution}s</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
