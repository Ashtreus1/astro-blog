'use client';

import { useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabaseClient';

interface Issue {
  issue: string;
  priority: 'Low' | 'Medium' | 'High';
}

export default function RequestTicketModal() {
  const [name, setName] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | ''>('');
  const [loading, setLoading] = useState(false);
  const [issuesList, setIssuesList] = useState<Issue[]>([]);

  useEffect(() => {
    const fetchIssues = async () => {
      const { data, error } = await supabase
        .from('sla_policy')
        .select('issue, priority');

      if (error) {
        console.error('Error fetching issues:', error);
      } else {
        setIssuesList(data as Issue[]);
      }
    };

    fetchIssues();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const selected = issuesList.find(i => i.issue === issue);
    const issuePriority = selected?.priority ?? 'Low';

    const { data, error } = await supabase.from('tickets').insert([
      { name, issue, priority: issuePriority, status: 'Open' }
    ]).select().single();

    setLoading(false);

    if (error) {
      console.error(error);
      alert('Failed to submit ticket.');
      return;
    }

    // If priority is Low, call the bot
    if (issuePriority.toLowerCase() === 'low') {
      await fetch('/api/bot-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: issue, ticketId: data.id }),
      });
    }

    window.location.href = `/chats/${data.id}`;
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
            <Label htmlFor="name-1">Name</Label>
            <Input id="name-1" value={name} onChange={e => setName(e.currentTarget.value)} required />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="issues-1">Issue</Label>
            <Select onValueChange={val => setIssue(val)} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an issue" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Issues</SelectLabel>
                  {issuesList.length > 0 ? (
                    issuesList.map((opt) => (
                      <SelectItem key={opt.issue} value={opt.issue}>
                        {opt.issue} ({opt.priority})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="">Loading...</SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox id="terms" required />
            <div className="grid gap-2">
              <Label htmlFor="terms">Accept SLA</Label>
              <p className="text-sm">
                By clicking this checkbox, you agree to the <a href="/sla" className="underline">service level agreement</a>.
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
