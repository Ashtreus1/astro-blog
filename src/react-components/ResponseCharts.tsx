// src/react-components/ResponseCharts.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ResponseCharts() {
  const [responsesPerDay, setResponsesPerDay] = useState<number[]>([]);
  const [averageResponse, setAverageResponse] = useState<number>(0);
  const [timeFrames, setTimeFrames] = useState([
    { label: "0-1", percent: 0 },
    { label: "1-6", percent: 0 },
    { label: "6-12", percent: 0 },
    { label: "12-24", percent: 0 },
    { label: "24+", percent: 0 },
  ]);

  useEffect(() => {
    fetchChartData();
  }, []);

  async function fetchChartData() {
    const { data, error } = await supabase
      .from("ticket_responses")
      .select("response_time_in_hours, created_at");

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    // Calculate number of responses per day (last 7 days)
    const today = new Date();
    const responseCounts = Array(7).fill(0);
    const frameBuckets = [0, 0, 0, 0, 0]; // Matches 0–1, 1–6, etc.

    data?.forEach(({ created_at, response_time_in_hours }) => {
      const createdDate = new Date(created_at);
      const dayDiff = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff < 7) {
        responseCounts[6 - dayDiff]++;
      }

      if (response_time_in_hours <= 1) frameBuckets[0]++;
      else if (response_time_in_hours <= 6) frameBuckets[1]++;
      else if (response_time_in_hours <= 12) frameBuckets[2]++;
      else if (response_time_in_hours <= 24) frameBuckets[3]++;
      else frameBuckets[4]++;
    });

    const totalResponses = data?.length ?? 0;
    const average = totalResponses ? (responseCounts.reduce((a, b) => a + b, 0) / 7) : 0;

    setResponsesPerDay(responseCounts);
    setAverageResponse(Math.round(average));

    setTimeFrames([
      { label: "0-1", percent: Math.round((frameBuckets[0] / totalResponses) * 100) },
      { label: "1-6", percent: Math.round((frameBuckets[1] / totalResponses) * 100) },
      { label: "6-12", percent: Math.round((frameBuckets[2] / totalResponses) * 100) },
      { label: "12-24", percent: Math.round((frameBuckets[3] / totalResponses) * 100) },
      { label: "24+", percent: Math.round((frameBuckets[4] / totalResponses) * 100) },
    ]);
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Number of Responses */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Number of Responses (Last 7 Days)</h3>
        <div className="h-40 bg-gray-100 rounded p-2 flex items-end justify-between">
          {responsesPerDay.map((count, i) => (
            <div key={i} className="w-6">
              <div
                className="bg-blue-500 rounded"
                style={{ height: `${(count / Math.max(...responsesPerDay)) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
        <p className="text-sm mt-2 text-red-500">
          Average Response per Day: {averageResponse}
        </p>
      </div>

      {/* Response Time Frame */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Response Time Frame</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          {timeFrames.map(({ label, percent }) => (
            <div key={label}>
              <div className="h-24 bg-gray-200 flex items-end justify-center">
                <div className="w-4 bg-blue-500" style={{ height: `${percent}%` }}></div>
              </div>
              <p className="text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
