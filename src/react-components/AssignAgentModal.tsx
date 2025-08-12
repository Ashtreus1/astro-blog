'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

interface Agent {
  id: string;
  name: string;
}

export default function AssignAgentModal() {
  const [open, setOpen] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  // ✅ Fetch agents once on mount
  useEffect(() => {
    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name')
        .eq('role', 'support_agent');

      if (!error && data) setAgents(data);
    };
    fetchAgents();
  }, []);

  // ✅ Attach event listener ONCE
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ ticketId: string }>;
      setTicketId(customEvent.detail.ticketId);
      setOpen(true);
    };

    window.addEventListener('openAssignModal', handler);

    return () => {
      window.removeEventListener('openAssignModal', handler);
    };
  }, []); // ✅ Empty dependency array ensures no duplicate listeners

  const assignAgent = async (agentId: string) => {
    if (!ticketId) return;

    const { error } = await supabase
      .from('tickets')
      .update({ agent_id: agentId, status: 'Assigned' })
      .eq('id', ticketId);

    if (error) {
      console.error('Error assigning agent:', error.message);
    } else {
      setOpen(false);
      window.dispatchEvent(new Event('refreshOverdueTickets'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a Support Agent</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {agents.length === 0 ? (
            <p className="text-sm text-gray-500">No support agents available.</p>
          ) : (
            agents.map((agent) => (
              <Button
                key={agent.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => assignAgent(agent.id)}
              >
                {agent.name}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
