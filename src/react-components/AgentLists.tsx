'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessagesSquare } from 'lucide-react';

type Agent = {
  id: string;
  name: string;
  is_available: boolean;
  ticketCount: number;
};

export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);

    // Get all support agents
    const { data: agentsData, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, is_available')
      .eq('role', 'support_agent');

    if (agentsError || !agentsData) {
      console.error('Error fetching agents:', agentsError);
      setLoading(false);
      return;
    }

    // Get ticket counts for each agent
    const updatedAgents: Agent[] = [];
    for (const agent of agentsData) {
      const { count, error: countError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('status', 'Assigned');

      if (!countError) {
        updatedAgents.push({
          ...agent,
          ticketCount: count ?? 0,
        });
      }
    }

    // ✅ Sort: fewest tickets first, 5/5 at the bottom
    updatedAgents.sort((a, b) => {
      const aFull = a.ticketCount >= 5;
      const bFull = b.ticketCount >= 5;

      if (aFull && !bFull) return 1; // a goes after b
      if (!aFull && bFull) return -1; // a goes before b

      return a.ticketCount - b.ticketCount; // both same availability → sort by count
    });

    setAgents(updatedAgents);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Available Agents</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading agents...</p>
      ) : agents.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No available agents</p>
      ) : (
        <div className="space-y-2 max-h-218 overflow-y-auto pr-2 custom-scrollbar">
          {agents.map((agent) => {
            const isFull = agent.ticketCount >= 5;
            return (
              <div
                key={agent.id}
                className="bg-white px-4 py-2 rounded shadow flex justify-between items-center"
              >
                <span>
                  {agent.name}{' '}
                  <span className="text-sm text-gray-500">
                    ({agent.ticketCount}/5 tickets
                    {isFull ? ' - Unavailable' : ''})
                  </span>
                </span>
                <button
                  onClick={() =>
                    (window.location.href = `/agents/logs?agentId=${agent.id}`)
                  }
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
                >
                  <MessagesSquare className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
