'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AgentHistory({
  agentId,
  onClose,
}: {
  agentId: string;
  onClose: () => void;
}) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agentId) {
      fetchConversations(agentId);
    }
  }, [agentId]);

  async function fetchConversations(agentId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('id, ticket_id, sender, content, created_at')
      .eq('sender', agentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto space-y-4">
        <h2 className="text-xl font-semibold">Agent Conversation History</h2>

        {loading ? (
          <p>Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No messages found for this agent.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {conversations.map((msg) => (
              <div key={msg.id} className="border-b pb-2">
                <p className="font-medium">
                  Ticket #{msg.ticket_id} –{' '}
                  <span className="text-gray-600">{msg.sender}</span>
                </p>
                <p className="text-gray-800">{msg.content}</p>
                <p className="text-xs text-gray-500">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
