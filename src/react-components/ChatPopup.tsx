'use client';

import { useState, useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// FAQ Component
// FAQ Component
const FAQ = ({ onFaqClick }: { onFaqClick: (question: string) => void }) => (
  <div className="faq-card p-2 border rounded mt-1 overflow-auto max-h-20 text-sm">
    <h5 className="italic text-sm mb-2 text-gray-700">Frequently Asked Questions:</h5>
    <ul className="space-y-1">
      <li className="flex items-center gap-1">
        <button
          onClick={() => onFaqClick('Why is my battery draining fast?')}
          className="text-blue-700 underline hover:text-blue-900 text-left flex-1"
        >
          Why is my battery draining fast?
        </button>
        <a href="/blogs/overheating-device" target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 text-gray-500 hover:text-gray-700" />
        </a>
      </li>

      <li className="flex items-center gap-1">
        <button
          onClick={() => onFaqClick('How to fix screen flicker?')}
          className="text-blue-700 underline hover:text-blue-900 text-left flex-1"
        >
          How to fix screen flicker?
        </button>
        <a href="/blogs/screen-flickering" target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 text-gray-500 hover:text-gray-700" />
        </a>
      </li>

      <li className="flex items-center gap-1">
        <button
          onClick={() => onFaqClick('Why is my device overheating?')}
          className="text-blue-700 underline hover:text-blue-900 text-left flex-1"
        >
          Why is my device overheating?
        </button>
        <a href="/blogs/overheating-device" target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 text-gray-500 hover:text-gray-700" />
        </a>
      </li>
    </ul>
  </div>
);


// ChatBox Component
const ChatBox = ({ senderType, priority, refProp }: { senderType: string; priority: string; refProp: any }) => {
  const [messages, setMessages] = useState<{ content: string; sender: string }[]>([]);
  const [msg, setMsg] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Expose a method to send messages programmatically
  useEffect(() => {
    if (refProp) {
      refProp.current = {
        sendMessage: (text: string) => handleSend(text),
      };
    }
  }, []);

  const appendMessage = (message: { content: string; sender: string }) => {
    setMessages((prev) => [...prev, message]);
  };

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage({ content: trimmed, sender: senderType });
    setMsg('');

    if (senderType === 'customer' && priority === 'Low') {
      try {
        const res = await fetch('/api/bot-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: trimmed, priority }),
        });

        const data = await res.json();

        const botReply = {
          content: data.reply || "I'm not sure how to help with that.",
          sender: 'bot',
        };

        appendMessage(botReply);
      } catch (error) {
        appendMessage({
          content: 'Sorry, there was an error getting a response.',
          sender: 'bot',
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(msg);
  };

  return (
    <div className="flex flex-col h-full text-sm">
      {/* Message Display Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1 text-sm">
        <div className="bot-message text-xs text-gray-500 mb-2">
          How may I help you?
        </div>

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === senderType ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-1.5 rounded-md shadow-sm text-xs
              ${m.sender === senderType ? 'bg-green-100 text-right rounded-br-none' : 'bg-blue-100 text-left rounded-bl-none'}`}
            >
              <div className="text-[10px] font-semibold text-gray-600 mb-1">{m.sender}</div>
              <ReactMarkdown children={m.content} remarkPlugins={[remarkGfm]} />
            </div>
          </div>
        ))}

        <div ref={containerRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-1 p-2 border-t bg-white">
        <Input
          value={msg}
          onChange={(e) => setMsg(e.currentTarget.value)}
          placeholder="Type a message..."
          className="flex-1 px-2 py-1.5 text-sm rounded-md"
        />
        <Button type="submit" className="bg-blue-500 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-600">
          Send
        </Button>
      </form>
    </div>
  );
};

// Main Chat Popup
const ChatApp = () => {
  const [isChatVisible, setChatVisible] = useState(false);
  const chatRef = useRef<any>(null);

  const handleFaqClick = (question: string) => {
    if (chatRef.current) {
      chatRef.current.sendMessage(question);
    }
  };

  return (
    <div>
      {/* Chat Trigger Button */}
      <button
        onClick={() => setChatVisible(true)}
        className="fixed bottom-4 right-4 bg-black text-white rounded-full p-3 shadow-lg hover:bg-gray-800"
      >
        💬
      </button>

      {/* Chat Modal */}
      {isChatVisible && (
        <div className="fixed bottom-4 right-4 w-[280px] h-[400px] sm:w-[380px] sm:h-[500px] bg-white shadow-2xl rounded-xl border flex flex-col text-sm">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-black text-white rounded-t-xl text-sm">
            <h1 className="text-sm font-semibold">Customer Support</h1>
            <button onClick={() => setChatVisible(false)} className="bg-red-500 px-2 py-0.5 rounded hover:bg-red-600 text-xs">
              X
            </button>
          </div>

          {/* FAQ */}
          <div className="px-2 pt-2">
            <FAQ onFaqClick={handleFaqClick} />
          </div>

          {/* Chat Body */}
          <div className="flex-1 px-1 pb-3 overflow-hidden">
            <ChatBox senderType="customer" priority="Low" refProp={chatRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
