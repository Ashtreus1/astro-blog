'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectGroup, SelectLabel, SelectItem
} from '@/components/ui/select';

import { useSlaIssues } from '@/hooks/useSlaIssues';
import { useCreateCustomer } from '@/hooks/useCreateCustomer';
import { useCreateTicket } from '@/hooks/useCreateTicket';

export default function RequestTicketModal() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [issue, setIssue] = useState('');
  const [loading, setLoading] = useState(false);

  const { issues } = useSlaIssues();
  const createCustomer = useCreateCustomer();
  const createTicket = useCreateTicket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const selected = issues.find(i => i.issue === issue);
    const priority = selected?.priority ?? 'Low';

    const { data: customer, error: customerError } = await createCustomer(name, email, issue);
    if (customerError || !customer) {
      setLoading(false);
      alert('Customer error. Please try again.');
      return;
    }

    const { data: ticket, error: ticketError } = await createTicket(customer.id, issue, priority);
    setLoading(false);

    if (ticketError || !ticket) {
      alert('Ticket error. Please try again.');
      return;
    }

    if (priority.toLowerCase() === 'low') {
      await fetch('/api/bot-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: issue, ticketId: ticket.id, priority }),
      });
    }

    window.location.href = `/chats/${ticket.id}`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Request a Ticket</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request a Ticket</DialogTitle>
          <DialogDescription>Fill out the form to get support.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.currentTarget.value)} required />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.currentTarget.value)} />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="issue">Issue</Label>
            <Select onValueChange={val => setIssue(val)} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an issue" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Issues</SelectLabel>
                  {issues.map((opt) => (
                    <SelectItem key={opt.issue} value={opt.issue}>
                      {opt.issue}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox id="terms" required />
            <div className="grid gap-2">
              <Label htmlFor="terms">Accept SLA</Label>
              <p className="text-sm">
                By clicking this checkbox, you agree to the{' '}
                <a href="/sla" className="underline">service level agreement</a>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
