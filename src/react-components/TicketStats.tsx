import React from "react";

const stats = [
  { title: "Resolved", count: 0 },
  { title: "Overdue", count: 0 },
  { title: "Unassigned", count: 0 },
];

export default function TicketStats() {
  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      {stats.map((s) => (
        <div key={s.title} className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold">{s.title}</h2>
          <p className="text-xl font-bold">{s.count.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
