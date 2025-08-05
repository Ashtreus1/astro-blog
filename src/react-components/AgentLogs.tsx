'use client';
import React, { useState } from 'react';
import type { FC } from 'react';

interface Message {
  id: string;
  ticket_id: string;
  sender: string;
  content: string;
  created_at: string;
}

interface TicketMessages {
  ticketId: string;
  customerName: string;
  createdAt: string;
  status: string;
  issue: string;
  messages: Message[];
}

interface AgentLogsProps {
  agentName: string;
  groupedMessages: TicketMessages[];
  agentId: string;
}

const colorThemes = [
  { border: 'border-pink-400', bg: 'bg-pink-50' },
  { border: 'border-yellow-400', bg: 'bg-yellow-50' },
  { border: 'border-green-400', bg: 'bg-green-50' },
  { border: 'border-blue-400', bg: 'bg-blue-50' },
  { border: 'border-purple-400', bg: 'bg-purple-50' },
  { border: 'border-orange-400', bg: 'bg-orange-50' }
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'resolved':
      return 'text-green-600 font-semibold';
    case 'unresolved':
      return 'text-red-600 font-semibold';
    default:
      return 'text-gray-700';
  }
};

const AgentLogs: FC<AgentLogsProps> = ({ agentName, groupedMessages, agentId }) => {
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  const toggleConversation = (ticketId: string) => {
    setOpenTicketId(prev => (prev === ticketId ? null : ticketId));
  };

  return (
    <div className="p-6 bg-white min-h-screen font-handdrawn text-gray-800">
      <h1 className="text-4xl mb-8">
        Activity Logs – <span className="italic text-xl">{agentName}</span>
      </h1>

      {groupedMessages.length === 0 ? (
        <p className="italic text-gray-400">No tickets or messages found for this agent.</p>
      ) : (
        <div className="space-y-6">
          {groupedMessages.map((ticket, index) => {
            const theme = colorThemes[index % colorThemes.length];
            const statusColor = getStatusColor(ticket.status);

            return (
              <div
                key={ticket.ticketId}
                className={`border-2 ${theme.border} ${theme.bg} rounded-2xl p-6`}
                style={{ boxShadow: '3px 3px 0px black' }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-10 text-base">
                      <span>
                        <strong>Customer name: </strong>
                        {ticket.customerName}
                      </span>
                      
                      <span>
                      <strong>Status: </strong>
                      {ticket.status}
                      </span>

                      <span>
                      <strong>Ticket Issue: </strong>
                      {ticket.issue}
                      </span>
                      
                  </div>
                  <button
                    onClick={() => toggleConversation(ticket.ticketId)}
                    className="underline text-blue-600 hover:text-blue-800 text-base"
                  >
                    {openTicketId === ticket.ticketId
                      ? 'Hide conversation'
                      : 'View full conversation'}
                  </button>
                </div>

                {openTicketId === ticket.ticketId && (
                  <div className="mt-4 pt-4 border-t space-y-2 max-h-80 overflow-y-auto">
                    {ticket.messages.map(msg => {
                      const isAgent = msg.sender === agentId;
                      return (
                        <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                              isAgent ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            <div className="font-bold text-xs mb-1">
                              {isAgent ? 'Support Agent' : ticket.customerName}
                            </div>
                            <div>{msg.content}</div>
                            <div className="text-[10px] mt-1 text-right opacity-60">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentLogs;
