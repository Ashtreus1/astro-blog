// src/react-components/AgentHistory.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AgentHistory({ onClose }: { onClose: () => void }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    fetchAgentsAndCustomers();
  }, []);

  async function fetchAgentsAndCustomers() {
    const [agentRes, customerRes] = await Promise.all([
      supabase.from("agents").select("id, name"),
      supabase.from("customers").select("id, name"),
    ]);

    setAgents(agentRes.data || []);
    setCustomers(customerRes.data || []);
  }

  async function fetchSpecificMessages() {
    if (!selectedAgent || !selectedCustomer) return;

    const { data: tickets, error: ticketError } = await supabase
      .from("tickets")
      .select("id")
      .eq("assigned_agent_id", selectedAgent)
      .eq("customer_id", selectedCustomer)
      .limit(1);

    if (ticketError || !tickets || tickets.length === 0) {
      alert("No ticket found for this agent.");
      console.error(ticketError);
      return;
    }

    const ticket = tickets[0];
    setTicketId(ticket.id);

    const { data: msgs, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });

    if (msgError) {
      alert("Failed to load messages.");
      console.error(msgError);
    } else {
      setConversations(msgs || []);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Agent-Customer Messages</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Dropdowns */}
        <div className="flex gap-2">
          <select
            className="w-1/2 border rounded p-2"
            value={selectedAgent ?? ""}
            onChange={(e) => setSelectedAgent(e.target.value)}
          >
            <option value="">Select Agent</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            className="w-1/2 border rounded p-2"
            value={selectedCustomer ?? ""}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchSpecificMessages}
          className="bg-blue-500 text-white px-4 py-2 mt-2 rounded hover:bg-blue-600 w-full"
          disabled={!selectedAgent || !selectedCustomer}
        >
          Load Messages
        </button>

        {ticketId && (
          <p className="text-sm text-gray-500 mt-2">
            Showing messages for ticket ID: <strong>{ticketId}</strong>
          </p>
        )}

        <ul className="space-y-3 text-sm mt-2">
          {conversations.map((msg) => (
            <li key={msg.id} className="border p-3 rounded shadow-sm">
              <div className="text-xs text-gray-500 mb-1">
                {new Date(msg.created_at).toLocaleString()}
              </div>
              <div>
                <strong>{msg.sender}</strong>: {msg.content}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
