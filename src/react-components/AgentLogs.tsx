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
  messages: Message[];
}

interface AgentLogsProps {
  agentName: string;
  groupedMessages: TicketMessages[];
  agentId: string;
}

const AgentLogs: FC<AgentLogsProps> = ({ agentName, groupedMessages, agentId }) => {
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Activity Logs
        <span className="text-gray-600 text-lg font-medium ml-2">– {agentName}</span>
      </h1>

      {groupedMessages.length === 0 ? (
        <p className="text-gray-500 italic">No messages found for this agent.</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {groupedMessages.map((ticket) => (
            <div
              key={ticket.ticketId}
              onClick={() => setOpenTicketId(openTicketId === ticket.ticketId ? null : ticket.ticketId)}
              className={`cursor-pointer w-80 transition-transform transform hover:scale-105 rounded-xl shadow-md border border-gray-200 p-4 bg-white hover:bg-blue-50 ${
                openTicketId === ticket.ticketId ? 'ring-2 ring-blue-400 bg-blue-100' : ''
              }`}
            >
              <div className="mb-2">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Customer:</span> {ticket.customerName}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Created:</span>{' '}
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Status:</span> {ticket.status}
                </p>
              </div>

              {openTicketId === ticket.ticketId && (
                <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                  {ticket.messages.map((msg) => {
                    const isAgent = msg.sender === agentId;
                    return (
                      <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-lg text-sm shadow ${
                            isAgent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <div className="font-medium text-xs mb-1">
                            {isAgent ? 'Support Agent' : 'Customer'}
                          </div>
                          <div>{msg.content}</div>
                          <div className="text-[10px] mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentLogs;
