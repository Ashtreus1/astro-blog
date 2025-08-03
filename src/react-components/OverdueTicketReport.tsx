'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';

export default function OverdueTicketReport({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  // Check for already overdue ticket on mount
  useEffect(() => {
    const checkInitialOverdue = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('id')
        .eq('customer_id', customerId)
        .eq('status', 'overdue')
        .limit(1)
        .single();

      if (!error && data) {
        setTicketId(data.id);
        setOpen(true);
      }
    };

    checkInitialOverdue();
  }, [customerId]);

  // Listen for overdue ticket updates
  useEffect(() => {
    const sub = supabase
      .channel(`overdue-alert-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          const { old: oldStatus, new: newStatus } = payload;

          if (
            oldStatus.status !== 'overdue' &&
            newStatus.status === 'overdue'
          ) {
            setTicketId(newStatus.id);
            setOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [customerId]);

  const handleSubmit = async () => {
    if (!reason.trim() || !ticketId) return;

    const { error } = await supabase.from('reports').insert([
      {
        reporter: customerId,
        ticket_id: ticketId,
        reason: reason.trim(),
        created_at: new Date().toISOString(),
      },
    ]);

    if (!error) {
      setReason('');
      setOpen(false);
      window.location.href = "/";
    } else {
      alert('Failed to submit report');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ticket Overdue</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mb-2">
          Your ticket has not been resolved in time. If you'd like to report the issue, please describe it below.
        </p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe your concern or dissatisfaction..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason.trim()}>
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
