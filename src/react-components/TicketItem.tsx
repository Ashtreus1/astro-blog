import { useEffect } from "react";
import { useSlaTimer } from "@/hooks/useSlaTimer";
import { supabase } from "@/lib/supabaseClient";

interface Ticket {
  id: string;
  issue: string;
  priority: string;
  status: string;
  agent_id: string | null;
  created_at: string;
  assigned_at?: string | null;
  resolved_at?: string | null;
  response_time_seconds: number;
  resolution_time_seconds: number;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export default function TicketItem({ ticket }: { ticket: Ticket }) {
  const slaTimer = useSlaTimer(
    ticket.created_at,
    ticket.priority,
    ticket.status,
    ticket.assigned_at,
    ticket.resolved_at,
    ticket.agent_id
  );

  // Update response_time_seconds in database
  useEffect(() => {
    const updateResponseTime = async () => {
      if (slaTimer.shouldShowResponseTimer && slaTimer.responseTimeElapsed !== ticket.response_time_seconds) {
        const { error } = await supabase
          .from("tickets")
          .update({ response_time_seconds: slaTimer.responseTimeElapsed })
          .eq("id", ticket.id);

        if (error) {
          console.error("Failed to update response time:", error);
        }
      }
    };

    updateResponseTime();
  }, [slaTimer.responseTimeElapsed, slaTimer.shouldShowResponseTimer, ticket.id, ticket.response_time_seconds]);

  // Mark ticket as overdue if response time exceeded
  useEffect(() => {
    if (slaTimer.isResponseOverdue && ticket.status.toLowerCase() !== "overdue") {
      const markOverdue = async () => {
        const { error } = await supabase
          .from("tickets")
          .update({ 
            status: "overdue",
            response_time_seconds: slaTimer.responseTimeElapsed
          })
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
  }, [slaTimer.isResponseOverdue, ticket.id, ticket.status, slaTimer.responseTimeElapsed]);

  const handleAssignClick = () => {
    window.dispatchEvent(
      new CustomEvent("openAssignModal", {
        detail: { ticketId: ticket.id },
      })
    );
  };

  return (
    <li className="border p-3 rounded flex justify-between items-center">
      <div className="flex-1">
        <p className="font-semibold">{ticket.issue}</p>
        <div className="flex items-center gap-4 mt-1">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            ticket.priority.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
            ticket.priority.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {ticket.priority}
          </span>
          <span className="text-xs text-gray-500">
            {ticket.status}
          </span>
        </div>

        {/* Response Time Timer */}
        {slaTimer.shouldShowResponseTimer && (
          <div className="mt-2">
            <p className={`text-sm font-medium ${
              slaTimer.isResponseOverdue ? "text-red-700" :
              slaTimer.responseTimeRemaining < 60 ? "text-orange-600" :
              "text-blue-600"
            }`}>
              Response SLA: {
                slaTimer.isResponseOverdue 
                  ? `⚠️ OVERDUE by ${formatTime(slaTimer.responseTimeElapsed - slaTimer.responseTimeRemaining)}`
                  : `${formatTime(slaTimer.responseTimeRemaining)} remaining`
              }
            </p>
          </div>
        )}

        {/* Resolution Time Timer */}
        {slaTimer.shouldShowResolutionTimer && (
          <div className="mt-1">
            <p className={`text-sm font-medium ${
              slaTimer.isResolutionOverdue ? "text-red-700" :
              slaTimer.resolutionTimeRemaining < 3600 ? "text-orange-600" : // Less than 1 hour
              "text-green-600"
            }`}>
              Resolution SLA: {
                slaTimer.isResolutionOverdue
                  ? `⚠️ OVERDUE by ${formatTime(slaTimer.resolutionTimeElapsed - slaTimer.resolutionTimeRemaining)}`
                  : `${formatTime(slaTimer.resolutionTimeRemaining)} remaining`
              }
            </p>
            <p className="text-xs text-gray-500">
              Working time: {formatTime(slaTimer.resolutionTimeElapsed)}
            </p>
          </div>
        )}

        {/* Show final times for resolved tickets */}
        {ticket.status.toLowerCase() === 'resolved' && (
          <div className="mt-2 text-xs text-gray-600">
            <p>✅ Resolved - Response: {formatTime(ticket.response_time_seconds)}, Resolution: {formatTime(ticket.resolution_time_seconds)}</p>
          </div>
        )}
      </div>

      <button
        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded ml-4"
        onClick={handleAssignClick}
      >
        Assign Agent
      </button>
    </li>
  );
}