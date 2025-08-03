'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import TicketItem from '@/react-components/TicketItem';

interface Ticket {
  id: string;
  issue: string;
  priority: string;
  status: string;
  agent_id: string | null;
  created_at: string;
  response_time_seconds: number;
}

export default function SlaTicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("status", "Open"); 

      if (error) {
        console.error("Error fetching SLA tickets:", error);
        return;
      }

      const filtered = (data || []).filter((t) => {
        const priority = t.priority?.toLowerCase();
        return (priority === "high" || priority === "medium") && !t.agent_id;
      });

      setTickets(filtered);
    };

    fetchTickets();

    const sub = supabase
      .channel("sla-ticket-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        fetchTickets
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="font-bold mb-2">Open Tickets</h2>
      {tickets.length === 0 ? (
        <p className="text-gray-500">No tickets.</p>
      ) : (
        <ul className="space-y-2">
          {tickets.map((ticket) => (
            <TicketItem key={ticket.id} ticket={ticket} />
          ))}
        </ul>
      )}
    </div>
  );
}
