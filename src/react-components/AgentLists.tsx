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

  // Function to get ticket count for a specific agent
  const getTicketCount = async (agentId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'Assigned');

    if (error) {
      console.error('Error fetching ticket count:', error);
      return 0;
    }

    return count ?? 0;
  };

  // Function to update ticket count for a specific agent
  const updateAgentTicketCount = async (agentId: string) => {
    const newCount = await getTicketCount(agentId);
    
    setAgents(prevAgents => {
      const updatedAgents = prevAgents.map(agent => 
        agent.id === agentId 
          ? { ...agent, ticketCount: newCount }
          : agent
      );

      // Re-sort agents after updating count
      return sortAgents(updatedAgents);
    });
  };

  // Function to sort agents (fewest tickets first, full agents at bottom)
  const sortAgents = (agentsList: Agent[]): Agent[] => {
    return [...agentsList].sort((a, b) => {
      const aFull = a.ticketCount >= 5;
      const bFull = b.ticketCount >= 5;

      if (aFull && !bFull) return 1; // a goes after b
      if (!aFull && bFull) return -1; // a goes before b

      return a.ticketCount - b.ticketCount; // both same availability → sort by count
    });
  };

  // Initial fetch of agents
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
      const ticketCount = await getTicketCount(agent.id);
      updatedAgents.push({
        ...agent,
        ticketCount,
      });
    }

    // Sort and set agents
    setAgents(sortAgents(updatedAgents));
    setLoading(false);
  }

  useEffect(() => {
    fetchAgents();

    // Set up real-time subscription for ticket changes
    const ticketChannel = supabase
      .channel('ticket-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          console.log('Ticket change detected:', payload);
          
          // Handle different types of changes
          if (payload.eventType === 'INSERT' && payload.new) {
            // New ticket assigned to an agent
            if (payload.new.agent_id && payload.new.status === 'Assigned') {
              updateAgentTicketCount(payload.new.agent_id);
            }
          } else if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            // Ticket status or assignment changed
            const oldAgentId = payload.old.agent_id;
            const newAgentId = payload.new.agent_id;
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;

            // If agent assignment changed
            if (oldAgentId !== newAgentId) {
              if (oldAgentId) updateAgentTicketCount(oldAgentId);
              if (newAgentId) updateAgentTicketCount(newAgentId);
            }
            // If status changed (e.g., from Assigned to resolved)
            else if (oldStatus !== newStatus) {
              if (newAgentId) updateAgentTicketCount(newAgentId);
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Ticket deleted
            if (payload.old.agent_id && payload.old.status === 'Assigned') {
              updateAgentTicketCount(payload.old.agent_id);
            }
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for agent availability changes
    const agentChannel = supabase
      .channel('agent-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents',
          filter: 'role=eq.support_agent',
        },
        (payload) => {
          console.log('Agent change detected:', payload);
          
          if (payload.new) {
            setAgents(prevAgents => {
              const updatedAgents = prevAgents.map(agent =>
                agent.id === payload.new.id
                  ? {
                      ...agent,
                      name: payload.new.name,
                      is_available: payload.new.is_available,
                    }
                  : agent
              );
              return sortAgents(updatedAgents);
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(agentChannel);
    };
  }, []);

  // Optional: Refresh data periodically as a backup
  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh ticket counts every 30 seconds as a fallback
      agents.forEach(agent => {
        updateAgentTicketCount(agent.id);
      });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [agents]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Available Agents</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Live updates</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
          <span className="text-sm">Loading agents...</span>
        </div>
      ) : agents.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No available agents</p>
      ) : (
        <div className="space-y-2 max-h-276 overflow-y-auto pr-2 custom-scrollbar">
          {agents.map((agent) => {
            const isFull = agent.ticketCount >= 5;
            return (
              <div
                key={agent.id}
                className={`bg-white px-4 py-3 rounded-lg shadow-sm border transition-all duration-200 flex justify-between items-center ${
                  isFull ? 'border-gray-200 opacity-75' : 'border-green-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    agent.is_available && !isFull ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <span className="font-medium">{agent.name}</span>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{agent.ticketCount}/5 tickets</span>
                      {isFull && <span className="text-orange-600 font-medium">• Full capacity</span>}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() =>
                    (window.location.href = `/agents/logs?agentId=${agent.id}`)
                  }
                  className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-1.5"
                >
                  <MessagesSquare className="w-4 h-4" />
                  <span className="text-sm">View</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}