'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessagesSquare } from 'lucide-react';

type Agent = {
  id: string;
  name: string;
  is_available: boolean;
};

export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_available', true);

    if (error) {
      console.error('Error fetching agents:', error);
    } else {
      setAgents(data || []);
    }

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
        <div className="space-y-2 max-h-90 overflow-y-auto pr-2 custom-scrollbar">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white px-4 py-2 rounded shadow flex justify-between items-center"
            >
              <span>{agent.name}</span>
              <button
                onClick={() =>
                  (window.location.href = `/agents/logs?agentId=${agent.id}`)
                }
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
              >
                <MessagesSquare className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
