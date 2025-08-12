'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/lib/supabaseClient';

type ResponseTimeData = {
  date: string;
  avgResponseTime: number;
  ticketCount: number;
  medianResponseTime: number;
};

type PriorityBreakdown = {
  priority: string;
  avgResponseTime: number;
  ticketCount: number;
};

export default function ResponseTimeMonitor() {
  const [timeData, setTimeData] = useState<ResponseTimeData[]>([]);
  const [priorityData, setPriorityData] = useState<PriorityBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [viewMode, setViewMode] = useState<'trend' | 'priority'>('trend');

  useEffect(() => {
    fetchResponseTimeData();
  }, [timeframe]);

  async function fetchResponseTimeData() {
    setLoading(true);
    
    const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    try {
      // Fetch tickets with response times
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, created_at, resolved_at, response_time_seconds, priority')
        .gte('created_at', startDate.toISOString())
        .not('response_time_seconds', 'is', null);

      if (error) throw error;

      if (tickets && tickets.length > 0) {
        // Process data for trend chart
        const trendData = processTrendData(tickets, daysBack);
        setTimeData(trendData);

        // Process data for priority breakdown
        const priorityBreakdown = processPriorityData(tickets);
        setPriorityData(priorityBreakdown);
      } else {
        setTimeData([]);
        setPriorityData([]);
      }
    } catch (error) {
      console.error('Error fetching response time data:', error);
      setTimeData([]);
      setPriorityData([]);
    }
    
    setLoading(false);
  }

  function processTrendData(tickets: any[], daysBack: number): ResponseTimeData[] {
    const dataMap = new Map<string, { times: number[], count: number }>();
    
    // Initialize all dates
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dataMap.set(dateStr, { times: [], count: 0 });
    }

    // Group tickets by date
    tickets.forEach(ticket => {
      const date = new Date(ticket.created_at).toISOString().split('T')[0];
      if (dataMap.has(date)) {
        const entry = dataMap.get(date)!;
        entry.times.push(ticket.response_time_seconds);
        entry.count++;
      }
    });

    // Calculate metrics for each date
    return Array.from(dataMap.entries()).map(([date, data]) => {
      const avgTime = data.times.length > 0 
        ? data.times.reduce((sum, time) => sum + time, 0) / data.times.length 
        : 0;
      
      const sortedTimes = data.times.sort((a, b) => a - b);
      const medianTime = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length / 2)]
        : 0;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgResponseTime: Math.round(avgTime / 60), // Convert to minutes
        medianResponseTime: Math.round(medianTime / 60),
        ticketCount: data.count
      };
    });
  }

  function processPriorityData(tickets: any[]): PriorityBreakdown[] {
    const priorityMap = new Map<string, number[]>();
    
    tickets.forEach(ticket => {
      const priority = ticket.priority || 'medium';
      if (!priorityMap.has(priority)) {
        priorityMap.set(priority, []);
      }
      priorityMap.get(priority)!.push(ticket.response_time_seconds);
    });

    return Array.from(priorityMap.entries()).map(([priority, times]) => ({
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      avgResponseTime: Math.round((times.reduce((sum, time) => sum + time, 0) / times.length) / 60),
      ticketCount: times.length
    })).sort((a, b) => {
      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
    });
  }

  const formatTooltip = (value: number, name: string) => {
    if (name === 'ticketCount') return [value, 'Tickets'];
    return [`${value} min`, name === 'avgResponseTime' ? 'Avg Response Time' : 'Median Response Time'];
  };

  return (
    <div className="bg-white rounded shadow p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Response Time Performance</h2>
        <div className="flex space-x-2">
          <select 
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'trend' | 'priority')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="trend">Trend View</option>
            <option value="priority">By Priority</option>
          </select>
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as '7d' | '30d' | '90d')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Loading response time data...</p>
        </div>
      ) : (
        <>
          {viewMode === 'trend' ? (
            <>
              {timeData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-400 italic">No response time data available</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickMargin={5}
                      />
                      <YAxis 
                        yAxisId="time"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="count"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Ticket Count', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip formatter={formatTooltip} />
                      <Legend />
                      <Line 
                        yAxisId="time"
                        type="monotone" 
                        dataKey="avgResponseTime" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Avg Response Time"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        yAxisId="time"
                        type="monotone" 
                        dataKey="medianResponseTime" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Median Response Time"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        yAxisId="count"
                        type="monotone" 
                        dataKey="ticketCount" 
                        stroke="#f59e0b" 
                        strokeWidth={1}
                        name="Daily Tickets"
                        dot={{ fill: '#f59e0b', strokeWidth: 1, r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <>
              {priorityData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-400 italic">No priority data available</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
                      <YAxis 
                        yAxisId="time"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Avg Response Time (min)', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="count"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Ticket Count', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'ticketCount' ? value : `${value} min`,
                          name === 'avgResponseTime' ? 'Avg Response Time' : 'Ticket Count'
                        ]}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="time"
                        dataKey="avgResponseTime" 
                        fill="#3b82f6" 
                        name="Avg Response Time"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar 
                        yAxisId="count"
                        dataKey="ticketCount" 
                        fill="#f59e0b" 
                        name="Ticket Count"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
          
          {/* Summary Stats */}
          {(timeData.length > 0 || priorityData.length > 0) && (
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-semibold text-blue-700">
                  {viewMode === 'trend' 
                    ? Math.round(timeData.reduce((sum, d) => sum + d.avgResponseTime, 0) / timeData.length) || 0
                    : Math.round(priorityData.reduce((sum, d) => sum + d.avgResponseTime, 0) / priorityData.length) || 0
                  } min
                </div>
                <div className="text-blue-600">Overall Avg</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-semibold text-green-700">
                  {viewMode === 'trend' 
                    ? timeData.reduce((sum, d) => sum + d.ticketCount, 0)
                    : priorityData.reduce((sum, d) => sum + d.ticketCount, 0)
                  }
                </div>
                <div className="text-green-600">Total Tickets</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="font-semibold text-yellow-700">
                  {viewMode === 'trend'
                    ? `${Math.round((timeData.filter(d => d.ticketCount > 0).length / timeData.length) * 100)}%`
                    : priorityData.length > 0 ? `${priorityData.length} levels` : '0'
                  }
                </div>
                <div className="text-yellow-600">
                  {viewMode === 'trend' ? 'Active Days' : 'Priority Levels'}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}