'use client';

import { useEffect, useState } from 'react';
import MessageBox from '@/react-components/MessageBox';
import OverdueTicketReport from '@/react-components/OverdueTicketReport';
import FeedbackReport from '@/react-components/FeedbackReport';
import { supabase } from '@/lib/supabaseClient';

interface Ticket {
  id: string;
  name: string;
  issue: string;
  status: string;
  customer_id: string;
  priority: 'Low' | 'Medium' | 'High';
}

export default function CustomerChat({ ticket }: { ticket: Ticket }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [initialLoad, setInitialLoad] = useState(false);

  // Function to append messages and avoid duplicates
  const appendMessage = (newMessage: any) => {
    setMessages((prev) => {
      // Check if message already exists (for optimistic updates)
      const exists = prev.some((m) => 
        m.content === newMessage.content && 
        m.sender === newMessage.sender &&
        Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000
      );
      return exists ? prev : [...prev, newMessage];
    });
  };

  // Handle status changes from MessageBox
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
  };

  // Load all existing messages and subscribe
  useEffect(() => {
    let messageChannel: any;
    let statusChannel: any;

    const init = async () => {
      // 1️⃣ Fetch existing messages first
      const { data: initialMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (!error) {
        setMessages(initialMessages || []);
      }

      // 2️⃣ Fetch current ticket status and priority
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('status, priority')
        .eq('id', ticket.id)
        .single();

      if (ticketData) {
        setStatus(ticketData.status);
        setPriority(ticketData.priority);
      }

      setInitialLoad(true);

      // 3️⃣ Subscribe to ticket status and priority updates
      statusChannel = supabase
        .channel(`ticket-updates-${ticket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tickets',
            filter: `id=eq.${ticket.id}`,
          },
          (payload) => {
            const newStatus = payload.new.status;
            const newPriority = payload.new.priority;
            
            if (newStatus && newStatus !== status) {
              setStatus(newStatus);
            }
            if (newPriority && newPriority !== priority) {
              setPriority(newPriority);
            }
          }
        )
        .subscribe();

      // 4️⃣ Subscribe to new messages (only if ticket is not resolved)
      if (status !== 'resolved') {
        messageChannel = supabase
          .channel(`messages-${ticket.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `ticket_id=eq.${ticket.id}`,
            },
            (payload) => {
              appendMessage(payload.new);
            }
          )
          .subscribe();
      }
    };

    init();

    // Cleanup
    return () => {
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (statusChannel) supabase.removeChannel(statusChannel);
    };
  }, [ticket.id]);

  // Re-subscribe to messages when status changes from resolved to something else
  useEffect(() => {
    if (status !== 'resolved' && initialLoad) {
      const messageChannel = supabase
        .channel(`messages-${ticket.id}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `ticket_id=eq.${ticket.id}`,
          },
          (payload) => {
            appendMessage(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
      };
    }
  }, [status, initialLoad, ticket.id]);

  const getStatusColor = (ticketStatus: string) => {
    switch (ticketStatus) {
      case 'Open': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'Assigned': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'Ongoing': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'resolved': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityColor = (ticketPriority: string) => {
    switch (ticketPriority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 bg-blue-50">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold">{ticket.name}</h2>
          <div className="flex gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(priority)}`}>
              {priority} Priority
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">{ticket.issue}</p>
        
        {/* Status change notifications */}
        {status === 'resolved' && (
          <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-700">
            🎉 Your issue has been resolved! If you need further assistance, please create a new ticket.
          </div>
        )}
        {status === 'Open' && priority === 'Medium' && ticket.priority === 'Low' && (
          <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded text-sm text-orange-700">
            📈 Your ticket has been escalated to our human support team for specialized assistance.
          </div>
        )}
      </div>

      {!initialLoad ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Loading chat...</span>
          </div>
        </div>
      ) : status !== 'Assigned' && status !== 'Ongoing' && status !== 'resolved' && priority !== 'Low' ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-lg italic px-6 text-center">
          <div className="max-w-md text-center">
            <div className="mb-4 text-4xl">⏳</div>
            <p>Your ticket has been submitted and is waiting for agent assignment.</p>
            <p className="text-sm text-gray-400 mt-2">Priority: {priority}</p>
          </div>
        </div>
      ) : (
        <MessageBox
          ticketId={ticket.id}
          messages={messages}
          appendMessage={appendMessage}
          senderType="customer"
          priority={priority}
          currentStatus={status}
          onStatusChange={handleStatusChange}
        />
      )}

      {status === 'resolved' && (
        <FeedbackReport
          ticketId={ticket.id}
          customerId={ticket.customer_id}
        />
      )}

      <OverdueTicketReport customerId={ticket.customer_id} />
    </div>
  );
}