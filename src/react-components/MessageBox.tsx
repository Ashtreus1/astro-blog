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
  disabled?: boolean;
  currentStatus?: string;
  onStatusChange?: (newStatus: string) => void;
}



export default function MessageBox({
  ticketId,
  senderType,
  messages,
  appendMessage,
  priority,
  disabled = false,
  currentStatus = 'Open',
  onStatusChange,
}: Props) {
  const [msg, setMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !msg.trim() || isProcessing) return;

    // Check if ticket is already resolved or escalated
    if (currentStatus === 'resolved') {
      alert('This ticket has been resolved. Please create a new ticket for additional issues.');
      return;
    }

    const newMessage = {
      ticket_id: ticketId,
      content: msg,
      sender: senderType,
      created_at: new Date().toISOString(),
    };

    appendMessage(newMessage); // Optimistic update
    const userMessage = msg;
    setMsg('');
    setIsProcessing(true);

    try {
      // Save user message first
      const { error: userMsgError } = await supabase.from('messages').insert([newMessage]);
      if (userMsgError) {
        console.error('Failed to save user message:', userMsgError);
        return;
      }

      // Call enhanced bot analysis API
      if (senderType === 'customer' && priority === 'Low') {
        const res = await fetch('/api/enhanced-bot-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ticketId, 
            userMessage, 
            priority,
            currentStatus 
          }),
        });

        if (res.ok) {
          const { reply, statusAnalysis, statusChanged } = await res.json();
          
          // Add bot reply to messages
          const botMessage = {
            ticket_id: ticketId,
            content: reply,
            sender: 'support',
            created_at: new Date().toISOString(),
          };
          appendMessage(botMessage);

          // Handle status changes only when explicitly changed
          if (statusChanged) {
            if (statusAnalysis === 'RESOLVED') {
              onStatusChange?.('resolved');
            } else if (statusAnalysis === 'ESCALATED') {
              onStatusChange?.('Open'); // Will be updated to 'Assigned' if agent available
            }
          }

        } else {
          console.error('Bot analysis failed:', await res.text());
          // Fallback: Add a generic support message
          appendMessage({
            ticket_id: ticketId,
            content: 'Thank you for your message. Our support team will review this and get back to you soon.',
            sender: 'support',
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('Message submission failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Disable input if ticket is resolved
  const isInputDisabled = disabled || isProcessing || currentStatus === 'resolved';

  return (
    <div className="flex flex-col h-full p-4">
      {/* Status indicator */}
      {currentStatus === 'resolved' && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-green-800 text-sm font-medium">
            This ticket has been resolved. Thank you for using our support!
          </p>
        </div>
      )}

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
                    {m.sender === 'support' ? 'Support Bot' : 'You'}{' '}
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
          placeholder={
            currentStatus === 'resolved' 
              ? "Ticket resolved - create new ticket for additional issues" 
              : "Type your message..."
          }
          className="flex-1"
          disabled={isInputDisabled}
        />
        <Button 
          type="submit" 
          disabled={isInputDisabled}
          className={isProcessing ? 'opacity-50' : ''}
        >
          {isProcessing ? 'Processing...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}