import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";

export default function SlaReport() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [priorityMetrics, setPriorityMetrics] = useState<any[]>([]);


  useEffect(() => {
    fetchSlaData();
  }, []);

  async function fetchSlaData() {
    setLoading(true);

    const { data: minDateData } = await supabase
      .from("tickets")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(1);

    const { data: maxDateData } = await supabase
      .from("tickets")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!minDateData?.[0] || !maxDateData?.[0]) {
      console.error("Error fetching ticket dates");
      setLoading(false);
      return;
    }

    const from = minDateData[0].created_at;
    const to = maxDateData[0].created_at;

    setStartDate(from);
    setEndDate(to);

    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("*")
      .gte("created_at", from)
      .lte("created_at", to);

    if (error || !tickets) {
      console.error("Error loading tickets:", error);
      setLoading(false);
      return;
    }

    const resolvedTickets = tickets.filter((t) => t.status === "Resolved");
    const violated = resolvedTickets.filter(
      (t) =>
        dayjs(t.resolved_at).diff(dayjs(t.created_at), "minute") >
        t.sla_target
    );

    const total = tickets.length;
    const resolvedWithinSLA = resolvedTickets.length - violated.length;

    const average = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const avgResponseMinutes = average(
      tickets
        .filter((t) => t.first_response_at)
        .map((t) =>
          dayjs(t.first_response_at).diff(dayjs(t.created_at), "minute")
        )
    );

    const avgResolutionMinutes = average(
      resolvedTickets.map((t) =>
        dayjs(t.resolved_at).diff(dayjs(t.created_at), "minute")
      )
    );

    setReport({
      total,
      resolvedWithinSLA,
      violated: violated.length,
      slaRate:
        resolvedTickets.length > 0
          ? Math.round((resolvedWithinSLA / resolvedTickets.length) * 100)
          : 0,
      avgResponseMinutes,
      avgResolutionMinutes,
    });

    setLoading(false);

    // Group tickets by priority
        const priorities = Array.from(new Set(tickets.map((t) => t.priority)));

        const priorityData = priorities.map((priority) => {
        const subset = tickets.filter((t) => t.priority === priority);
        const resolved = subset.filter((t) => t.status === "Resolved");
        const met = resolved.filter(
            (t) =>
            dayjs(t.resolved_at).diff(dayjs(t.created_at), "minute") <=
            t.sla_target
        );
        const avgResp = average(
            subset
            .filter((t) => t.first_response_at)
            .map((t) =>
                dayjs(t.first_response_at).diff(dayjs(t.created_at), "minute")
            )
        );
        const avgRes = average(
            resolved.map((t) =>
            dayjs(t.resolved_at).diff(dayjs(t.created_at), "minute")
            )
        );

        return {
            priority,
            slaTarget: resolved[0]?.sla_target ?? "N/A",
            percentMet:
            resolved.length > 0
                ? Math.round((met.length / resolved.length) * 100)
                : 0,
            avgResponse: avgResp,
            avgResolution: avgRes,
        };
});

setPriorityMetrics(priorityData);

  }

  if (loading || !report || !startDate || !endDate)
    return (
      <div className="bg-blue-100 text-blue-800 py-6 px-4 rounded-xl shadow text-center text-lg font-medium my-10 mx-auto max-w-xl">
        Loading SLA Report...
      </div>
    );

  return (
    <div className="text-gray-900">
      {/* Report Title and Period */}
      <div className="mb-10 text-center">
        <p className="text-sm text-gray-600">
          Reporting Period: {dayjs(startDate).format("MMMM D, YYYY")} –{" "}
          {dayjs(endDate).format("MMMM D, YYYY")}
        </p>
      </div>

      {/* Executive Summary */}
      <div className="rounded-2xl p-6 mb-10 bg-white shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
        <ul className="text-lg space-y-1">
            <li>
            Total Tickets: <strong>{report.total}</strong>
            </li>
            <li>
            Resolved within SLA: <strong>{report.resolvedWithinSLA}</strong>
            </li>
            <li>
            Violated SLA: <strong>{report.violated}</strong>
            </li>
            <li>
            SLA Compliance Rate: <strong>{report.slaRate}%</strong>
            </li>
        </ul>
        </div>


      {/* SLA Metrics Table */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-3">SLA Metrics</h3>
        <table className="w-full border text-base">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">Metric</th>
              <th className="p-3 border">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border">Average Response Time</td>
              <td className="p-3 border">{report.avgResponseMinutes} minutes</td>
            </tr>
            <tr>
              <td className="p-3 border">Average Resolution Time</td>
              <td className="p-3 border">
                {Math.floor(report.avgResolutionMinutes / 60)} hours{" "}
                {report.avgResolutionMinutes % 60} minutes
              </td>
            </tr>
            <tr>
              <td className="p-3 border">Total Tickets Received</td>
              <td className="p-3 border">{report.total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Performance by Priority Table */}
        <div className="mb-10">
        <h3 className="text-xl font-semibold mb-3">Performance by Priority</h3>
        <table className="w-full border text-base">
            <thead>
            <tr className="bg-gray-100 text-left">
                <th className="p-3 border">Priority</th>
                <th className="p-3 border">SLA Target (mins)</th>
                <th className="p-3 border">% Met</th>
                <th className="p-3 border">Avg. Response Time</th>
                <th className="p-3 border">Avg. Resolution Time</th>
            </tr>
            </thead>
            <tbody>
            {priorityMetrics.map((p) => (
                <tr key={p.priority}>
                <td className="p-3 border capitalize">{p.priority}</td>
                <td className="p-3 border">{p.slaTarget}</td>
                <td className="p-3 border">{p.percentMet}%</td>
                <td className="p-3 border">{p.avgResponse} mins</td>
                <td className="p-3 border">
                    {Math.floor(p.avgResolution / 60)} hrs {p.avgResolution % 60} mins
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>

      {/* Recommendations */}
      <div className="bg-white border rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Recommendations:</h3>
        <ul className="list-disc pl-6 space-y-2 text-base font-medium">
          <li>
            <span className="font-semibold">Optimize staffing</span> during peak
            hours to prevent response and resolution delays.
          </li>
          <li>
            <span className="font-semibold">Improve SLA breach alerts</span> to
            notify supervisors in real-time when tickets are nearing SLA limits.
          </li>
          <li>
            <span className="font-semibold">Provide targeted training</span> for
            agents handling high-priority or complex issues.
          </li>
        </ul>
      </div>
    </div>
  );
}
