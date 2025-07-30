import React from "react";
import TicketStats from "@/react-components/TicketStats";
import AgentList from "@/react-components/AgentLists";
import ResponseCharts from "@/react-components/ResponseCharts";
import AssignTicketModal from "@/react-components/AssignTicketModal";

export default function AdminPanel() {
  return (
    <div className="grid grid-cols-3 gap-4 p-6 bg-gray-100 text-gray-800">
      <div className="col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">ChatDesk</h1>
          
          {/* Link to SLA Report */}
          <a href="/report">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              SLA Report
            </button>
          </a>
        </div>

        <TicketStats />
        <ResponseCharts />
      </div>

      <AgentList />
      <AssignTicketModal />
    </div>
  );
}
