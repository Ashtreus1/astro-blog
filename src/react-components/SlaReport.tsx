'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabaseClient';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// ==========================
// Types & Constants
// ==========================
type Ticket = {
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  response_time_seconds: number;
  resolution_time_seconds: number | null;
  created_at: string;
  resolved_at: string | null;
};

type TicketSLA = {
  responseMet: boolean;
  resolutionMet: boolean;
  overallMet: boolean;
  isOverdue: boolean;
  responseBreachSeconds: number;
  resolutionBreachSeconds: number;
};

const SLA_RESOLUTION_LIMITS: Record<Ticket['priority'], number> = {
  High: 86400,    // 24 hours - must be LESS than this
  Medium: 172800, // 48 hours - must be LESS than this  
  Low: 0,         // No SLA for Low priority
};

const SLA_RESPONSE_LIMITS: Record<Ticket['priority'], number> = {
  High: 300,   // 5 minutes - must be LESS than this
  Medium: 900, // 15 minutes - must be LESS than this
  Low: 0,      // No SLA for Low priority
};

const PRIORITY_ORDER: Ticket['priority'][] = ['High', 'Medium', 'Low'];

const COLORS = ['#219ebc', '#009689', '#104e64'];

const chartConfig = {
  percentMet: { label: '% SLA Met', color: 'var(--chart-1)', disabled: false },
  avgResponse: { label: 'Avg. Response (s)', color: 'var(--chart-2)', disabled: false },
  avgResolution: { label: 'Avg. Resolution (s)', color: 'var(--chart-3)', disabled: false },
};

function calculateAverage(values: number[]): number {
  return values.length
    ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
    : 0;
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

const ZeroValueLabel = ({ x, y, width, value }: any) =>
  value === 0 ? (
    <text x={x + width / 2} y={y - 5} fill="#999" fontSize={14} textAnchor="middle">
      0
    </text>
  ) : null;

const CountValueLabel = ({ x, y, width, value }: any) =>
  value !== 0 ? (
    <text x={x + width / 2} y={y - 5} fill="#333" fontSize={14} textAnchor="middle">
      {value}
    </text>
  ) : null;

const SmartLabel = (props: any) =>
  props.value === 0 ? <ZeroValueLabel {...props} /> : <CountValueLabel {...props} />;

// ==========================
// Main Component
// ==========================
export default function SlaReport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<keyof typeof chartConfig>('percentMet');

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(
          'status, priority, response_time_seconds, resolution_time_seconds, created_at, resolved_at'
        );
      if (!error && data) {
        setTickets(data as Ticket[]);
      }
      setLoading(false);
    };
    fetchTickets();
  }, []);

  const {
    avgResponse,
    avgResolution,
    reportPeriod,
    performanceByPriority,
    overallSlaPercent,
    counts,
    overdueCount,
    slaBreakdown
  } = useMemo(() => {
    const now = dayjs();

    // Enhanced SLA calculation function
    const calculateTicketSLA = (ticket: Ticket): TicketSLA => {
      // Skip Low priority tickets - they don't have SLA requirements
      if (ticket.priority === 'Low') {
        return {
          responseMet: true,
          resolutionMet: true,
          overallMet: true,
          isOverdue: false,
          responseBreachSeconds: 0,
          resolutionBreachSeconds: 0
        };
      }

      const responseLimit = SLA_RESPONSE_LIMITS[ticket.priority];
      const resolutionLimit = SLA_RESOLUTION_LIMITS[ticket.priority];

      // Response SLA check (must be LESS THAN limit, not equal)
      const responseMet = ticket.response_time_seconds < responseLimit;
      const responseBreachSeconds = Math.max(0, ticket.response_time_seconds - responseLimit);

      // Resolution SLA check
      let resolutionMet = true;
      let resolutionBreachSeconds = 0;
      let isOverdue = false;

      // Check if ticket status is explicitly "overdue"
      if (ticket.status.toLowerCase() === 'overdue') {
        resolutionMet = false;
        isOverdue = true;
        // Calculate how long it's been overdue
        const secondsOpen = now.diff(dayjs(ticket.created_at), 'second');
        resolutionBreachSeconds = Math.max(0, secondsOpen - resolutionLimit);
      } else if (ticket.resolved_at && ticket.resolution_time_seconds !== null) {
        // Ticket is resolved - check actual resolution time (must be LESS THAN limit)
        resolutionMet = ticket.resolution_time_seconds < resolutionLimit;
        resolutionBreachSeconds = Math.max(0, ticket.resolution_time_seconds - resolutionLimit);
      } else if (!ticket.resolved_at && ticket.status.toLowerCase() !== 'resolved') {
        // Ticket is still open - check if it's overdue by time
        const secondsOpen = now.diff(dayjs(ticket.created_at), 'second');
        if (secondsOpen >= resolutionLimit) {
          resolutionMet = false;
          isOverdue = true;
          resolutionBreachSeconds = secondsOpen - resolutionLimit;
        }
      }

      return {
        responseMet,
        resolutionMet,
        overallMet: responseMet && resolutionMet,
        isOverdue,
        responseBreachSeconds,
        resolutionBreachSeconds
      };
    };

    // Calculate SLA metrics for all tickets
    const ticketsWithSLA = tickets.map(ticket => ({
      ...ticket,
      sla: calculateTicketSLA(ticket)
    }));

    // Count overdue tickets (unresolved tickets past their SLA deadline)
    const overdueTickets = ticketsWithSLA.filter(t => t.sla.isOverdue);
    const overdueCount = overdueTickets.length;

    // Calculate overall SLA percentage
    // Based on SLA-eligible tickets only (excludes Low priority)
    const slaEligibleTickets = ticketsWithSLA.filter(t => t.priority !== 'Low');
    const slaCompliantTickets = slaEligibleTickets.filter(t => t.sla.overallMet);
    
    // CRITICAL FIX: Overdue tickets should ALWAYS reduce SLA percentage
    const overallSlaPercent = slaEligibleTickets.length > 0
      ? Math.round((slaCompliantTickets.length / slaEligibleTickets.length) * 100)
      : 100; // 100% only if NO SLA-eligible tickets exist

    // Debug information for troubleshooting
    console.log('SLA Calculation Debug:', {
      totalTickets: tickets.length,
      slaEligibleCount: slaEligibleTickets.length,
      slaCompliantCount: slaCompliantTickets.length,
      slaViolatedCount: slaEligibleTickets.length - slaCompliantTickets.length,
      overdueCount: overdueCount,
      lowPriorityCount: tickets.filter(t => t.priority === 'Low').length,
      calculatedSlaPercent: overallSlaPercent,
      slaLimits: { SLA_RESPONSE_LIMITS, SLA_RESOLUTION_LIMITS },
      overdueTickets: overdueTickets.map(t => ({
        id: t.created_at,
        priority: t.priority,
        status: t.status,
        response_time: t.response_time_seconds,
        resolution_time: t.resolution_time_seconds,
        isOverdue: t.sla.isOverdue,
        responseMet: t.sla.responseMet,
        resolutionMet: t.sla.resolutionMet,
        overallMet: t.sla.overallMet
      })),
      sampleViolations: slaEligibleTickets
        .filter(t => !t.sla.overallMet)
        .slice(0, 5)
        .map(t => ({
          id: t.created_at,
          priority: t.priority,
          status: t.status,
          response_time: t.response_time_seconds,
          response_limit: SLA_RESPONSE_LIMITS[t.priority],
          response_met: t.sla.responseMet,
          resolution_time: t.resolution_time_seconds,
          resolution_limit: SLA_RESOLUTION_LIMITS[t.priority],
          resolution_met: t.sla.resolutionMet,
          overall_met: t.sla.overallMet
        }))
    });

    // Calculate performance by priority
    const performance = PRIORITY_ORDER.map((priority) => {
      const priorityTickets = ticketsWithSLA.filter((t) => t.priority === priority);
      const compliantTickets = priorityTickets.filter(t => t.sla.overallMet);
      
      return {
        priority,
        percentMet: priorityTickets.length ? Math.round((compliantTickets.length / priorityTickets.length) * 100) : 100,
        avgResolution: calculateAverage(
          priorityTickets
            .filter(t => t.resolution_time_seconds !== null)
            .map((t) => t.resolution_time_seconds!)
        ),
        avgResponse: calculateAverage(priorityTickets.map((t) => t.response_time_seconds)),
        totalTickets: priorityTickets.length,
        slaMetCount: compliantTickets.length,
        slaViolatedCount: priorityTickets.length - compliantTickets.length,
      };
    });

    // Calculate date range
    const resolvedTickets = tickets.filter((t) => t.resolved_at !== null);
    const startDate = tickets.length
      ? dayjs(Math.min(...tickets.map((t) => +new Date(t.created_at)))).format('MMMM D, YYYY')
      : '';
    const endDate = tickets.length
      ? dayjs(
          Math.max(...tickets.map((t) => +new Date(t.resolved_at || t.created_at)))
        ).format('MMMM D, YYYY')
      : '';

    // Calculate averages for all tickets
    const totalResponseTime = tickets.reduce((sum, t) => sum + t.response_time_seconds, 0);
    const totalResolutionTime = resolvedTickets
      .filter(t => t.resolution_time_seconds !== null)
      .reduce((sum, t) => sum + t.resolution_time_seconds!, 0);

    const slaBreakdown = {
      totalTickets: tickets.length,
      slaEligibleTickets: slaEligibleTickets.length,
      lowPriorityTickets: tickets.filter(t => t.priority === 'Low').length,
      slaCompliantTickets: slaCompliantTickets.length,
      slaViolatedTickets: slaEligibleTickets.length - slaCompliantTickets.length,
      responseBreaches: slaEligibleTickets.filter(t => !t.sla.responseMet).length,
      resolutionBreaches: slaEligibleTickets.filter(t => !t.sla.resolutionMet).length,
      overdueTickets: overdueCount,
      resolvedTickets: resolvedTickets.length,
      openTickets: tickets.length - resolvedTickets.length
    };

    return {
      avgResponse: calculateAverage(tickets.map((t) => t.response_time_seconds)),
      avgResolution: calculateAverage(
        resolvedTickets
          .filter(t => t.resolution_time_seconds !== null)
          .map((t) => t.resolution_time_seconds!)
      ),
      reportPeriod: startDate && endDate ? `Reporting Period: ${startDate} to ${endDate}` : '',
      performanceByPriority: performance,
      overallSlaPercent,
      overdueCount,
      slaBreakdown,
      counts: {
        slaMet: slaCompliantTickets.length,
        slaViolated: slaEligibleTickets.length - slaCompliantTickets.length,
        totalTickets: tickets.length,
        slaEligibleTickets: slaEligibleTickets.length,
        totalResponseTime,
        totalResolutionTime,
        totalResolvedTickets: resolvedTickets.length,
      }
    };
  }, [tickets]);

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading SLA Report...</div>;
  }

  const explanations: Record<string, string> = {
    'Overall % SLA Met': `
      Percentage of SLA-eligible tickets (High/Medium priority) that met BOTH response and resolution targets.
      
      CURRENT CALCULATION:
      • Total SLA-eligible tickets: ${counts.slaEligibleTickets} (excludes ${slaBreakdown.lowPriorityTickets} Low priority)
      • Tickets meeting SLA: ${counts.slaMet}
      • Tickets violating SLA: ${counts.slaViolated}
      • Formula: (${counts.slaMet} ÷ ${counts.slaEligibleTickets}) × 100 = ${overallSlaPercent}%
      
      SLA REQUIREMENTS:
      • High Priority: Response < 5min (300s), Resolution < 24hrs (86400s)
      • Medium Priority: Response < 15min (900s), Resolution < 48hrs (172800s)
      • Low Priority: No SLA requirements (auto-pass)
      
      ⚠️ STRICT LIMITS: Times must be LESS THAN the limit (not equal to)
      ⚠️ Example: 300 seconds = SLA VIOLATION for High priority (must be < 300)
      
      SLA VIOLATIONS INCLUDE:
      • Response time exceeded: ${slaBreakdown.responseBreaches} tickets
      • Resolution time exceeded: ${slaBreakdown.resolutionBreaches} tickets
      • Currently overdue (unresolved): ${overdueCount} tickets
      
      ⚠️ ANY ticket that fails EITHER response OR resolution counts as overall SLA failure.
      ⚠️ If you see 100% with overdue tickets, check console for debug info.
    `,
    'Avg. Response Time': `
      Average time taken to provide the first response to ALL tickets (regardless of priority).
      
      CALCULATION:
      • Total response time: ${counts.totalResponseTime.toLocaleString()}s
      • Total tickets: ${counts.totalTickets}
      • Formula: ${counts.totalResponseTime.toLocaleString()}s ÷ ${counts.totalTickets} = ${avgResponse}s
      • Human readable: ${formatSeconds(avgResponse)}
      
      This metric includes all tickets to show overall team responsiveness.
    `,
    'Avg. Resolution Time': `
      Average time taken to fully resolve tickets (RESOLVED tickets only).
      
      CALCULATION:
      • Total resolution time: ${counts.totalResolutionTime.toLocaleString()}s
      • Resolved tickets with data: ${counts.totalResolvedTickets}
      • Formula: ${counts.totalResolutionTime.toLocaleString()}s ÷ ${counts.totalResolvedTickets} = ${avgResolution}s
      • Human readable: ${formatSeconds(avgResolution)}
      
      Only includes tickets that have been fully resolved with valid resolution times.
    `,
    'Overdue Tickets': `
      Number of OPEN tickets that have exceeded their SLA resolution deadline and are still unresolved.
      
      BREAKDOWN:
      • Total tickets: ${slaBreakdown.totalTickets}
      • Open tickets: ${slaBreakdown.openTickets}
      • Resolved tickets: ${slaBreakdown.resolvedTickets}
      • Currently overdue: ${overdueCount}
      
      ⚠️ These ${overdueCount} tickets are actively hurting your SLA and need immediate attention!
      ⚠️ This does NOT include tickets that were resolved late (those are counted in resolution breaches).
    `
  };

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold mb-1">SLA Report</h2>
          <p className="text-sm text-muted-foreground">{reportPeriod}</p>
          <br />
          <p className="text-sm text-muted-foreground mt-1">
            This report shows SLA compliance based on priority-specific targets. 
            Only High and Medium priority tickets are subject to SLA requirements.
          </p>
          <div className="mt-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            <div><strong>Ticket Breakdown:</strong></div>
            <div>• Total: {slaBreakdown.totalTickets} | SLA-Eligible: {slaBreakdown.slaEligibleTickets} | Low Priority: {slaBreakdown.lowPriorityTickets}</div>
            <div>• SLA Compliant: {slaBreakdown.slaCompliantTickets} | SLA Violated: {slaBreakdown.slaViolatedTickets} | Currently Overdue: {overdueCount}</div>
          </div>
        </div>

        <Tabs
          defaultValue={selectedMetric}
          onValueChange={(v) => setSelectedMetric(v as keyof typeof chartConfig)}
          className="w-full md:w-auto"
        >
          <TabsList className="flex gap-2">
            {Object.entries(chartConfig).map(([key, cfg]) => (
              <TabsTrigger
                key={key}
                value={key}
                className={`rounded-md border px-4 py-2 text-sm font-medium
                  data-[state=active]:bg-primary data-[state=active]:text-white`}
              >
                {cfg.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>SLA Performance by Priority</CardTitle>
            <CardDescription>
              Visual comparison of SLA compliance across High, Medium, and Low priority tickets.
              {selectedMetric === 'percentMet' && ' (Low priority tickets auto-pass SLA as they have no requirements)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full min-h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceByPriority} barGap={8}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="priority"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                    <Bar
                      key={selectedMetric}
                      dataKey={selectedMetric}
                      radius={4}
                      label={<SmartLabel />}
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {performanceByPriority.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index] || chartConfig[selectedMetric].color}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="text-muted-foreground leading-none font-bold">
              Based on {tickets.length} total ticket(s) — {counts.slaEligibleTickets} SLA-eligible
            </div>
            {selectedMetric === 'percentMet' && (
              <div className="grid grid-cols-3 gap-4 w-full text-xs mt-2">
                {performanceByPriority.map((perf) => (
                  <div key={perf.priority} className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">{perf.priority} Priority</div>
                    <div className="text-green-600 font-semibold">✓ {perf.slaMetCount} compliant</div>
                    <div className="text-red-600 font-semibold">✗ {perf.slaViolatedCount} violated</div>
                    <div className="text-muted-foreground">of {perf.totalTickets} total</div>
                  </div>
                ))}
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Summary Cards */}
        <div className="flex flex-col gap-4">
          <StatCard
            title="Overall % SLA Met"
            value={`${overallSlaPercent}%`}
            description={`${counts.slaMet}/${counts.slaEligibleTickets} SLA-eligible tickets meeting targets`}
            icon="📈"
            helpText={explanations['Overall % SLA Met']}
            alertLevel={overallSlaPercent < 95 ? 'warning' : 'good'}
          />
          <StatCard
            title="Overdue Tickets"
            value={`${overdueCount}`}
            description="Open tickets past their SLA resolution deadline"
            icon="⚠️"
            helpText={explanations['Overdue Tickets']}
            alertLevel={overdueCount > 0 ? 'critical' : 'good'}
          />
          <StatCard
            title="Avg. Response Time"
            value={formatSeconds(avgResponse)}
            description={`Average: ${avgResponse}s across all ${counts.totalTickets} tickets`}
            icon="⏱️"
            helpText={explanations['Avg. Response Time']}
            alertLevel={'neutral'}
          />
          <StatCard
            title="Avg. Resolution Time"
            value={formatSeconds(avgResolution)}
            description={`Average: ${avgResolution}s for ${counts.totalResolvedTickets} resolved tickets`}
            icon="⏳"
            helpText={explanations['Avg. Resolution Time']}
            alertLevel={'neutral'}
          />
        </div>
      </div>
    </div>
  );
}

// ==========================
// Reusable Summary Card
// ==========================
function StatCard({
  title,
  value,
  description,
  icon,
  helpText,
  alertLevel = 'neutral',
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
  helpText: string;
  alertLevel?: 'good' | 'warning' | 'critical' | 'neutral';
}) {
  const [open, setOpen] = useState(false);

  const getBackgroundGradient = () => {
    switch (alertLevel) {
      case 'good':
        return 'from-green-600 to-green-700';
      case 'warning':
        return 'from-yellow-500 to-orange-600';
      case 'critical':
        return 'from-red-600 to-red-700';
      default:
        return 'from-[#2C3E50] to-[#4CA1AF]';
    }
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${getBackgroundGradient()} text-white shadow-lg`}>
      {/* HoverCard with click-to-open */}
      <HoverCard open={open} onOpenChange={setOpen}>
        <HoverCardTrigger asChild>
          <button
            onClick={() => setOpen(!open)}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
          >
            ?
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="max-w-md text-sm whitespace-pre-line">
          {helpText}
        </HoverCardContent>
      </HoverCard>

      <CardContent className="p-5 flex flex-col justify-between h-full">
        <p className="text-sm font-medium">{title}</p>
        <CardDescription className="text-xs text-white/80 mt-1 mb-2">{description}</CardDescription>
        <p className="text-3xl font-bold mt-2">{value}</p>
        <div className="absolute bottom-2 right-2 opacity-30 text-[60px]">{icon}</div>
      </CardContent>
    </Card>
  );
}