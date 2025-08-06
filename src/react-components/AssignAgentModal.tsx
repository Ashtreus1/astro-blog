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

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setTicketId(e.detail.ticketId);
      setOpen(true);
    };

    window.addEventListener('openAssignModal', handler as EventListener);
    return () => window.removeEventListener('openAssignModal', handler as EventListener);
  }, []);

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
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a Support Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
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
