'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  ticketId: string;
  senderType: 'support' | 'customer';
  messages: any[];
  appendMessage: (message: any) => void;
  priority: 'Low' | 'Medium' | 'High';
}

export default function MessageBox({
  ticketId,
  senderType,
  messages,
  appendMessage,
  priority,
}: Props) {
  const [msg, setMsg] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = msg.trim();
    if (!content) return;

    const newMessage = {
      ticket_id: ticketId,
      content,
      sender: senderType,
      created_at: new Date().toISOString(),
    };

    // Optimistically append only if sender is customer
    if (senderType === 'customer') {
      appendMessage(newMessage);
    }

    setMsg('');

    const { error } = await supabase.from('messages').insert([newMessage]);
    if (error) {
      console.error('Failed to send message:', error);
      return;
    }

    // Bot reply for low-priority tickets
    if (senderType === 'customer' && priority === 'Low') {
      try {
        const res = await fetch('/api/bot-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, userMessage: content, priority }),
        });

        if (res.ok) {
          const { reply } = await res.json();
          appendMessage({
            ticket_id: ticketId,
            content: reply,
            sender: 'support',
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Bot reply failed:', err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-400 italic">No messages yet.</p>
        ) : (
          messages.map((m, i) => {
            const isMine = m.sender === senderType;
            return (
              <div
                key={i}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs sm:max-w-md px-4 py-2 rounded-xl shadow-sm text-sm ${
                    isMine
                      ? 'bg-green-200 text-right rounded-br-none'
                      : 'bg-blue-100 text-left rounded-bl-none'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    {m.sender}{' '}
                    <span className="text-[10px] text-gray-400 ml-1">
                      {new Date(m.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <ReactMarkdown
                    children={m.content}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          className="text-blue-600 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                      code: ({ inline, className, children, ...props }) => (
                        <code
                          className={`bg-gray-200 px-1 py-0.5 rounded text-xs font-mono ${
                            inline ? '' : 'block my-1'
                          }`}
                          {...props}
                        >
                          {children}
                        </code>
                      ),
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
        <div ref={containerRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={msg}
          onChange={(e) => setMsg(e.currentTarget.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
