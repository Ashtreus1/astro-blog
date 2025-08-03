import React, { useState } from "react";
import TicketStats from "@/react-components/TicketStats";
import AgentList from "@/react-components/AgentLists";
// import ResponseCharts from "@/react-components/ResponseCharts";
import SlaTicketList from "@/react-components/SlaTicketList"; 
import TicketActions from "@/react-components/TicketActionsUI";

export default function AdminPanel() {
  const [showPending, setShowPending] = useState(false);

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

            <a href="/agents/report">
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                SLA Report
              </button>
            </a>
          </div>
        </div>

        {showPending && <SlaTicketList />}
        <TicketStats />
        {/*<ResponseCharts />*/}
      </div>

      <AgentList />
    </div>
  );
}
