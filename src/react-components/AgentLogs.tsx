'use client';
import React, { useState } from 'react';
import type { FC } from 'react';

interface Message {
  id: string;
  ticket_id: string;
  sender: 'support' | 'customer';
  content: string;
  created_at: string;
}

interface TicketMessages {
  ticketId: string;
  customerName: string;
  createdAt?: string | null;
  status: string;
  issue: string;
  messages: Message[];
}

interface AgentLogsProps {
  agentName: string;
  groupedMessages: TicketMessages[];
  agentId: string;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'resolved':
      return 'text-green-600 font-semibold';
    case 'unresolved':
      return 'text-red-600 font-semibold';
    default:
      return 'text-yellow-500 font-semibold';
  }
};

const AgentLogs: FC<AgentLogsProps> = ({ agentName, groupedMessages }) => {
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  const toggleConversation = (ticketId: string) => {
    setOpenTicketId(prev => (prev === ticketId ? null : ticketId));
  };

  return (
    <div className="p-6 bg-white min-h-screen font-sans text-gray-800">
      <h1 className="text-5xl font-bold mb-6">
        Activity Log – <span className="italic text-3xl">{agentName}</span>
      </h1>

      {groupedMessages.length === 0 ? (
        <p className="italic text-gray-400">No tickets or messages found for this agent.</p>
      ) : (
        <div className="border rounded-xl overflow-hidden shadow">
          <div className="divide-y divide-gray-300">
            {groupedMessages.map((ticket, index) => {
              const statusColor = getStatusColor(ticket.status);
              const isOpen = openTicketId === ticket.ticketId;

              return (
                <div
                  key={ticket.ticketId}
                  className={`${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  } hover:bg-gray-100 transition-colors`}
                >
                  {/* Ticket Header Row */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-8 py-6">
                    <div className="flex flex-wrap items-center gap-8 text-lg">
                      <span>
                        <strong>Customer Name:</strong> {ticket.customerName}
                      </span>

                      <span>
                        <strong>Status:</strong>{' '}
                        <span className={`${statusColor}`}>{ticket.status}</span>
                      </span>

                      <span>
                        <strong>Date Submitted:</strong>{' '}
                        {ticket.createdAt
                          ? new Date(ticket.createdAt).toLocaleDateString()
                          : 'Unknown'}
                      </span>

                      <span>
                        <strong>Ticket Issue:</strong>{' '}
                        <span className="text-red-500 font-semibold">{ticket.issue}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => toggleConversation(ticket.ticketId)}
                      className="text-green-600 font-semibold hover:underline"
                    >
                      {isOpen ? 'Hide Conversation' : 'View Full Conversation'}
                    </button>
                  </div>

                  {/* Conversation Dropdown */}
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-8 pb-6 bg-gray-50 border-t custom-scrollbar max-h-64 overflow-y-auto">
                      {ticket.messages.map(msg => {
                        const isAgent = msg.sender === 'support';
                        const displayName = isAgent ? agentName : ticket.customerName;

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isAgent ? 'justify-end' : 'justify-start'} mb-2`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                                isAgent
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-200 text-gray-800'
                              }`}
                            >
                              <div className="font-bold text-xs mb-1">{displayName}</div>
                              <div>{msg.content}</div>
                              <div className="text-[10px] mt-1 text-right opacity-60">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentLogs;
