'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

interface Props {
  ticketId: string;
  senderType: 'support' | 'customer';
  messages: any[];
  appendMessage: (message: any) => void;
}

export default function MessageBox({ ticketId, senderType, messages, appendMessage }: Props) {
  const [msg, setMsg] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chan = supabase
      .channel(`messages-${ticketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `ticket_id=eq.${ticketId}`,
      }, (payload) => appendMessage(payload.new))
      .subscribe();

    return () => supabase.removeChannel(chan);
  }, [ticketId, appendMessage]);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;

    await supabase.from('messages').insert([
      {
        ticket_id: ticketId,
        content: msg,
        sender: senderType,
      }
    ]);

    if (senderType === 'customer') {
      // Trigger the bot follow-up
      await fetch('/api/bot-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, userMessage: msg }),
      });
    }

    setMsg('');
  };

  return (
    <div className="flex flex-col flex-1 justify-between h-full p-4">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-400 italic">No messages yet.</p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`p-2 rounded max-w-prose text-sm ${
                m.sender === 'support' ? 'bg-blue-100' : 'bg-green-100'
              }`}
            >
              <div>
                <strong>{m.sender}</strong>{' '}
                <span className="text-xs text-gray-500">
                  {new Date(m.created_at).toLocaleTimeString()}
                </span>
              </div>
              <div>{m.content}</div>
            </div>
          ))
        )}
        <div ref={containerRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={msg}
          onChange={(e) => setMsg(e.currentTarget.value)}
          placeholder="Type message..."
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
