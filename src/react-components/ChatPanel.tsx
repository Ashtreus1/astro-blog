'use client';

import { useEffect, useState, useRef } from 'react';
import TicketSidebar from '@/react-components/TicketSidebar';
import MessageBox from '@/react-components/MessageBox';
import { supabase } from '@/lib/supabaseClient';
import { useFetchTickets } from '@/hooks/useFetchTickets';
import type { Ticket } from '@/hooks/useFetchTickets';
import { Button } from '@/components/ui/button';

export default function ChatPanel({ agentId }: { agentId: string }) {
  const tickets = useFetchTickets(agentId);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer based on assigned_at from DB
  useEffect(() => {
    if (selected && selected.assigned_at && !selected.resolved_at) {
      const assignedTime = new Date(selected.assigned_at).getTime();

      setElapsedSeconds(Math.floor((Date.now() - assignedTime) / 1000));

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - assignedTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selected]);

  // Fetch messages and subscribe to new ones
  useEffect(() => {
    if (!selected) return;

    let isMounted = true;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', selected.id)
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error);
      if (isMounted) setMessages(data || []);
    };

    fetchMessages();

    const chan = supabase
      .channel(`messages-${selected.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${selected.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id);
            return exists ? prev : [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(chan);
    };
  }, [selected]);

  const handleResolve = async () => {
    if (!selected) return;

    const resolvedAt = new Date().toISOString();
    const totalSeconds = elapsedSeconds;

    const { data, error } = await supabase
      .from('tickets')
      .update({
        status: 'resolved',
        resolved_at: resolvedAt,
        resolution_time_seconds: totalSeconds
      })
      .eq('id', selected.id)
      .select();

    if (error) {
      console.error('Failed to resolve ticket:', error);
      alert('Failed to resolve ticket: ' + error.message);
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            status: 'resolved',
            resolved_at: resolvedAt,
            resolution_time_seconds: totalSeconds
          }
        : prev
    );
  };

  return (
    <div className="flex h-full">
      <TicketSidebar tickets={tickets} selected={selected} onSelect={setSelected} />
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="border-b p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <p className="text-sm">{`${selected.issue} – ${selected.status}`}</p>
                {selected.status !== 'resolved' && (
                  <p className="text-xs text-gray-500">
                    Resolution time: {elapsedSeconds}s
                  </p>
                )}
              </div>
              {selected.status !== 'resolved' && (
                <Button onClick={handleResolve} variant="outline">
                  Resolve
                </Button>
              )}
            </div>
            <MessageBox
              ticketId={selected.id}
              messages={messages}
              appendMessage={() => {}}
              senderType="support"
              priority={selected.priority}
              disabled={selected.status === 'resolved'}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            No assigned tickets yet.
          </div>
        )}
      </div>
    </div>
  );
}
