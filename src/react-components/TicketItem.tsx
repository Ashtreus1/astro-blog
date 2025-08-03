import { useEffect } from "react";
import { useSlaCountdown } from "@/hooks/useSlaCountdown";
import { supabase } from "@/lib/supabaseClient";
import AssignAgentModal from "@/react-components/AssignAgentModal";

interface Ticket {
  id: string;
  issue: string;
  priority: string;
  status: string;
  agent_id: string | null;
  created_at: string;
  response_time_seconds: number;
}

export default function TicketItem({ ticket }: { ticket: Ticket }) {
  const countdown = useSlaCountdown(ticket.created_at, ticket.response_time_seconds);

  const shouldRunCountdown =
    ticket.status.toLowerCase() !== "assigned" &&
    ticket.status.toLowerCase() !== "ongoing" &&
    ticket.agent_id === null;

  useEffect(() => {
    if (
      shouldRunCountdown &&
      countdown <= 0 &&
      ticket.status.toLowerCase() !== "overdue"
    ) {
      const markOverdue = async () => {
        const { error } = await supabase
          .from("tickets")
          .update({ status: "overdue" })
          .eq("id", ticket.id)
          .eq("status", ticket.status);

        if (error) {
          console.error("Failed to mark ticket as overdue:", error.message);
        } else {
          console.log(`Ticket ${ticket.id} marked as overdue.`);
        }
      };

      markOverdue();
    }
  }, [shouldRunCountdown, countdown, ticket.id, ticket.status]);

  const handleAssignClick = () => {
    window.dispatchEvent(
      new CustomEvent("openAssignModal", {
        detail: { ticketId: ticket.id },
      })
    );
  };

  return (
    <li className="border p-3 rounded flex justify-between items-center">
      <div>
        <p className="font-semibold">{ticket.issue}</p>
        <p className="text-sm text-gray-600">Priority: {ticket.priority}</p>
        {shouldRunCountdown && (
          <p
            className={`text-sm ${
              countdown <= 0 ? "text-red-700 font-bold" : "text-red-500"
            }`}
          >
            {countdown <= 0
              ? "SLA expired"
              : `SLA: ${countdown}s remaining`}
          </p>
        )}
      </div>

      <button
        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
        onClick={handleAssignClick}
      >
        Assign Agent
      </button>

      {/* Global modal listener */}
      <AssignAgentModal />
    </li>
  );
}
