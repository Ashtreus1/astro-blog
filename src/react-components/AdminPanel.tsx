'use client';

import React, { useState, useEffect } from "react";
import TicketStats from "@/react-components/TicketStats";
import AgentList from "@/react-components/AgentLists";
import SlaTicketList from "@/react-components/SlaTicketList"; 
import SlaReport from "@/react-components/SlaReport"; // Import the SLA Report component
import { supabase } from "@/lib/supabaseClient";
import AssignAgentModal from "@/react-components/AssignAgentModal";

type Ticket = {
  id: string;
  issue: string;
  customers?: { name: string };
  created_at: string;
};

export default function AdminPanel() {
  const [showPending, setShowPending] = useState(false);
  const [overdueTickets, setOverdueTickets] = useState<Ticket[]>([]);
  const [loadingOverdue, setLoadingOverdue] = useState(true);

  useEffect(() => {
  fetchOverdueTickets();

  const handleRefresh = () => {
    fetchOverdueTickets();
  };

  window.addEventListener("refreshOverdueTickets", handleRefresh);

  return () => {
    window.removeEventListener("refreshOverdueTickets", handleRefresh);
  };
}, []);

  async function fetchOverdueTickets() {
    setLoadingOverdue(true);

    const { data, error } = await supabase
      .from("tickets")
      .select(`id, issue, created_at, customers(name)`)
      .eq("status", "overdue");

    if (error) {
      console.error("Error fetching overdue tickets:", error);
      setOverdueTickets([]);
    } else {
      setOverdueTickets(data || []);
    }

    setLoadingOverdue(false);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Opens modal via custom event
  function openAssignModal(ticketId: string) {
    window.dispatchEvent(new CustomEvent("openAssignModal", { detail: { ticketId } }));
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-6 text-gray-800">
      <div className="col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">ChatDesk</h1>
          <div className="space-x-2">
            <button
              onClick={() => setShowPending((prev) => !prev)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Pending Tickets
            </button>
            {/* Removed SLA Report button */}
          </div>
        </div>

        {showPending && (
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            <SlaTicketList />
          </div>
        )}
        <TicketStats />
        
        {/* Added SLA Report component below SlaTicketList */}
        <div className="mt-4">
          <SlaReport />
        </div>
      </div>
      
      <div>
        
        {/* Priority Section */}
        <div className="bg-white rounded shadow p-4 mb-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="text-lg font-semibold">Priority - Overdue</h2>
            {!loadingOverdue && overdueTickets.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center">
                {overdueTickets.length}
              </span>
            )}
          </div>
          {loadingOverdue ? (
            <p className="text-sm text-gray-500">Loading overdue tickets...</p>
          ) : overdueTickets.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No overdue tickets</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {overdueTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {ticket.issue || `Ticket #${ticket.id}`}
                    </span>
                    <div className="text-xs text-gray-500">
                      {ticket.customers?.name || "Unknown Customer"} • {formatDate(ticket.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      openAssignModal(ticket.id);
                    }}
                    disabled={document.querySelector('[data-state="open"]')} // disables if modal already open
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                  >
                    
                    Assign Agent
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <AgentList />
      </div>

        

      {/* Modal Component */}
      <AssignAgentModal />
    </div>
  );
}