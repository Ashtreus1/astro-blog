// src/react-components/TicketStats.tsx
import React from "react";

const stats = [
  { title: "Unresolved", count: 271461 },
  { title: "Overdue", count: 41414 },
  { title: "Due Today", count: 65175 },
  { title: "Open", count: 13141 },
  { title: "On Hold", count: 64126 },
  { title: "Unassigned", count: 36151 },
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
