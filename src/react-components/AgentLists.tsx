import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AssignTicketModal from "./AssignTicketModal";

type Agent = {
  id: string;
  name: string;
  is_available: boolean;
};

export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("is_available", true);

    if (error) {
      console.error("Error fetching agents:", error);
    } else {
      setAgents(data || []);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Available Agents</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading agents...</p>
      ) : agents.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No available agents</p>
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white px-4 py-2 rounded shadow flex justify-between items-center"
            >
              <span>{agent.name}</span>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Assign Ticket
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Component */}
      {showModal && (
        <AssignTicketModal />
      )}
    </div>
  );
}
