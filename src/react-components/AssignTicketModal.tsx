import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AgentHistory from "./AgentHistory"; // ⬅ Import the separated component

export default function AssignTicketModal() {
  const [show, setShow] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle AgentHistory modal
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (show) fetchData();
  }, [show]);

  async function fetchData() {
    const [ticketRes, agentRes] = await Promise.all([
      supabase.from("tickets").select("id, subject").is("assigned_agent_id", null),
      supabase.from("agents").select("id, name").eq("is_available", true),
    ]);

    setTickets(ticketRes.data || []);
    setAgents(agentRes.data || []);
  }

  async function assignTicket() {
    if (!selectedTicket || !selectedAgent) return;

    setLoading(true);
    const { error } = await supabase
      .from("tickets")
      .update({ assigned_agent_id: selectedAgent })
      .eq("id", selectedTicket);

    setLoading(false);

    if (error) {
      alert("Failed to assign ticket.");
      console.error(error);
    } else {
      alert("Ticket assigned successfully!");
      setShow(false);
    }
  }

  return (
    <>
      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShow(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Assign Ticket
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Conversation History
        </button>
      </div>

      {/* Assign Ticket Modal */}
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 space-y-4">
            <h2 className="text-xl font-semibold">Assign Ticket</h2>

            {/* Ticket Selector */}
            <div>
              <label className="block text-sm font-medium mb-1">Select Ticket</label>
              <select
                className="w-full border rounded p-2"
                value={selectedTicket ?? ""}
                onChange={(e) => setSelectedTicket(e.target.value)}
              >
                <option value="">-- Choose a ticket --</option>
                {tickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Agent Selector */}
            <div>
              <label className="block text-sm font-medium mb-1">Assign to Agent</label>
              <select
                className="w-full border rounded p-2"
                value={selectedAgent ?? ""}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="">-- Choose an agent --</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShow(false)}
                className="px-4 py-2 bg-gray-200 rounded"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={assignTicket}
                className="px-4 py-2 bg-blue-600 text-white rounded"
                disabled={loading || !selectedTicket || !selectedAgent}
              >
                {loading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent History Modal */}
      {showHistory && <AgentHistory onClose={() => setShowHistory(false)} />}
    </>
  );
}
