'use client';

import { useEffect, useState } from 'react';
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

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type Ticket = {
  status: string;
  priority: string;
  response_time_seconds: number;
  resolution_time_seconds: number;
  created_at: string;
  resolved_at: string | null;
};

const priorityOrder = ['High', 'Medium', 'Low'];

const ZeroValueLabel = ({ x, y, width, value }: any) => {
  if (value === 0) {
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#999"
        fontSize={14}
        textAnchor="middle"
      >
        0
      </text>
    );
  }
  return null;
};

const CountValueLabel = ({ x, y, width, value }: any) => {
  if (value !== 0) {
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#333"
        fontSize={14}
        textAnchor="middle"
      >
        {value}
      </text>
    );
  }
  return null;
};

const SmartLabel = (props: any) =>
  props.value === 0 ? <ZeroValueLabel {...props} /> : <CountValueLabel {...props} />;

const chartConfig = {
  percentMet: {
    label: '% SLA Met',
    color: 'var(--chart-1)',
  },
  avgResponse: {
    label: 'Avg. Response (s)',
    color: 'var(--chart-2)',
  },
  avgResolution: {
    label: 'Avg. Resolution (s)',
    color: 'var(--chart-3)',
  },
};

export default function SlaReport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'percentMet' | 'avgResponse' | 'avgResolution'>('percentMet');

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('status, priority, response_time_seconds, resolution_time_seconds, created_at, resolved_at');

      if (!error && data) setTickets(data);
      setLoading(false);
    };

    fetchTickets();
  }, []);

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading SLA Report...</div>;
  }

  const resolvedTickets = tickets.filter(t => t.resolved_at !== null);
  const slaMetTickets = resolvedTickets.filter(t => t.resolution_time_seconds <= 86400);

  const calculateAverage = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((sum, val) => sum + val, 0) / arr.length) : 0;

  const avgResponse = calculateAverage(tickets.map(t => t.response_time_seconds));
  const avgResolution = calculateAverage(resolvedTickets.map(t => t.resolution_time_seconds));

  const startDate = tickets.length
    ? dayjs(Math.min(...tickets.map(t => +new Date(t.created_at)))).format('MMMM D, YYYY')
    : '';

  const endDate = tickets.length
    ? dayjs(Math.max(...tickets.map(t => +new Date(t.resolved_at || t.created_at)))).format('MMMM D, YYYY')
    : '';

  const reportPeriod = startDate && endDate ? `Reporting Period: ${startDate} to ${endDate}` : '';

  const performanceByPriority = priorityOrder.map(priority => {
    const group = tickets.filter(t => t.priority === priority);
    const met = group.filter(t => t.resolved_at && t.resolution_time_seconds <= 86400);

    return {
      priority,
      percentMet: group.length ? Math.round((met.length / group.length) * 100) : 0,
      avgResolution: calculateAverage(group.map(t => t.resolution_time_seconds)),
      avgResponse: calculateAverage(group.map(t => t.response_time_seconds)),
    };
  });

  const overallSlaPercent = tickets.length
    ? Math.round((slaMetTickets.length / tickets.length) * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold mb-1">SLA Report</h2>
          <p className="text-sm text-muted-foreground">{reportPeriod}</p>
          <br></br>
          <p className="text-sm text-muted-foreground mt-1">
            This report summarizes SLA compliance by showing the percentage of tickets resolved within 24 hours,
            and average response and resolution times categorized by ticket priority.
          </p>
        </div>

        <Tabs
          defaultValue={selectedMetric}
          onValueChange={(v) => setSelectedMetric(v as any)}
          className="w-full md:w-auto"
        >
          <TabsList className="flex gap-2">
            {Object.keys(chartConfig).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-md border px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {chartConfig[key as keyof typeof chartConfig].label}
              </TabsTrigger>
            ))}
          </TabsList>
          <p className="text-xs text-muted-foreground mt-2 ml-2">
            Toggle between metrics to visualize SLA performance by priority.
          </p>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>SLA Performance</CardTitle>
            <CardDescription>
              Visual comparison of SLA compliance across High, Medium, and Low priority tickets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full min-h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceByPriority} barGap={8}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="priority" axisLine={false} tickLine={false} tickMargin={10} />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                    <Bar dataKey={selectedMetric} radius={4} label={<SmartLabel />}>
                      {performanceByPriority.map((entry, index) => {
                        const colors = ['#219ebc', '#009689', '#104e64'];
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={colors[index] || chartConfig[selectedMetric].color}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="text-muted-foreground leading-none font-bold">
              Based on {tickets.length} ticket(s)
            </div>
          </CardFooter>
        </Card>

        {/* Summary Cards */}
        <div className="flex flex-col gap-4">
          <StatCard
            title="Overall % SLA Met"
            value={`${overallSlaPercent}%`}
            description="Percentage of all resolved tickets completed within 24 hours."
            icon="📈"
          />
          <StatCard
            title="Avg. Response Time"
            value={`${avgResponse}s`}
            description="Average time in seconds it took to respond to all tickets."
            icon="⏱️"
          />
          <StatCard
            title="Avg. Resolution Time"
            value={`${avgResolution}s`}
            description="Average time in seconds it took to resolve tickets fully."
            icon="⏳"
          />
        </div>
      </div>
    </div>
  );
}

// Reusable Summary Card
function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
}) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-[#2C3E50] to-[#4CA1AF] text-white shadow-lg">
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <p className="text-sm">{title}</p>
        <CardDescription className="text-xs text-white/80">
          {description}
        </CardDescription>
        <p className="text-3xl font-bold">{value}</p>
        <div className="absolute bottom-2 right-2 opacity-30 text-[60px]">{icon}</div>
      </CardContent>
    </Card>
  );
}
