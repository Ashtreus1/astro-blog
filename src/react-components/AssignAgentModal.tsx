'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

interface Agent {
  id: string;
  name: string;
  ticketCount: number;
}

export default function AssignAgentModal() {
  const [open, setOpen] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch agents without updating DB
  const fetchAgentsWithAvailability = async () => {
    setLoading(true);

    const { data: agentsData, error: agentsError } = await supabase
      .from('agents')
      .select('id, name')
      .eq('role', 'support_agent');

    if (agentsError || !agentsData) {
      setAgents([]);
      setLoading(false);
      return;
    }

    const updatedAgents: Agent[] = [];

    for (const agent of agentsData) {
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('status', 'Assigned');

      updatedAgents.push({
        ...agent,
        ticketCount: count ?? 0,
      });
    }

    setAgents(updatedAgents);
    setLoading(false);
  };

  // ✅ Listen for modal open
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ ticketId: string }>;
      setTicketId(customEvent.detail.ticketId);
      fetchAgentsWithAvailability(); // get fresh data
      setOpen(true);
    };

    window.addEventListener('openAssignModal', handler);
    return () => {
      window.removeEventListener('openAssignModal', handler);
    };
  }, []);

  const assignAgent = async (agentId: string) => {
    if (!ticketId) return;

    const { error } = await supabase
      .from('tickets')
      .update({ agent_id: agentId, status: 'Assigned' })
      .eq('id', ticketId);

    if (!error) {
      setOpen(false);
      window.dispatchEvent(new Event('refreshOverdueTickets'));
    } else {
      console.error('Error assigning agent:', error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a Support Agent</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {loading ? (
            <p className="text-sm text-gray-500">Loading agents...</p>
          ) : agents.length === 0 ? (
            <p className="text-sm text-gray-500">No support agents available.</p>
          ) : (
            agents.map((agent) => {
              const isFull = agent.ticketCount >= 5;
              return (
                <Button
                  key={agent.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => !isFull && assignAgent(agent.id)}
                  disabled={isFull}
                >
                  {agent.name} {isFull && ' (Unavailable)'}
                </Button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
