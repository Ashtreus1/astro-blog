'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';

export default function FeedbackReport({
  customerId,
  ticketId,
}: {
  customerId: string;
  ticketId: string;
}) {
  const [open, setOpen] = useState(true);
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return;

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
      window.location.href = '/';
    } else {
      alert('Failed to submit feedback');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How was the support?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mb-2">
          Your ticket is now marked as resolved. Let us know how the support went.
        </p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Write your feedback..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason.trim()}>
            Submit Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
