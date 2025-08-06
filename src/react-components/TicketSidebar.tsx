'use client';

import type { Ticket } from '@/hooks/useFetchTickets';

interface Props {
  tickets: Ticket[];
  selected: Ticket | null;
  onSelect: (ticket: Ticket) => void;
}

export default function TicketSidebar({ tickets, selected, onSelect }: Props) {
  return (
    <aside className="w-1/4 border-r overflow-y-auto h-full">
      <ul>
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <button
              onClick={() => onSelect(ticket)}
              className={`w-full text-left p-4 hover:bg-gray-100 ${
                selected?.id === ticket.id ? 'bg-blue-100' : ''
              }`}
            >
              <div className="font-semibold">{ticket.name}</div>
              <div className="text-sm">{ticket.issue}</div>
              <div className="text-xs text-gray-500">{ticket.status}</div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
