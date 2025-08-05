'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
} from 'recharts';
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
import dayjs from 'dayjs';

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

const SmartLabel = (props: any) => {
  const { value } = props;
  return value === 0 ? <ZeroValueLabel {...props} /> : <CountValueLabel {...props} />;
};

export default function SlaReport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'percentMet' | 'avgResponse' | 'avgResolution'>('percentMet');

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(
          'status, priority, response_time_seconds, resolution_time_seconds, created_at, resolved_at'
        );

      if (!error && data) setTickets(data);
      setLoading(false);
    };

    fetchTickets();
  }, []);

  if (loading)
    return <div className="p-4 text-muted-foreground">Loading SLA Report...</div>;

  const resolvedTickets = tickets.filter((t) => t.resolved_at !== null);
  const slaMetTickets = resolvedTickets.filter(
    (t) => t.resolution_time_seconds <= 86400
  );

  const avgResponse = Math.round(
    tickets.reduce((sum, t) => sum + t.response_time_seconds, 0) / tickets.length
  );

  const avgResolution = Math.round(
    resolvedTickets.reduce((sum, t) => sum + t.resolution_time_seconds, 0) /
      resolvedTickets.length
  );

  const startDate = tickets.length
    ? dayjs(
        tickets.reduce(
          (earliest, t) =>
            dayjs(t.created_at).isBefore(dayjs(earliest)) ? t.created_at : earliest,
          tickets[0].created_at
        )
      ).format('MMMM D, YYYY')
    : '';

  const endDate = tickets.length
    ? dayjs(
        tickets.reduce(
          (latest, t) =>
            dayjs(t.resolved_at || t.created_at).isAfter(dayjs(latest))
              ? t.resolved_at || t.created_at
              : latest,
          tickets[0].created_at
        )
      ).format('MMMM D, YYYY')
    : '';

  const reportPeriod =
    startDate && endDate ? `Reporting Period: ${startDate} to ${endDate}` : '';

  const performanceByPriority = priorityOrder.map((priority) => {
    const group = tickets.filter((t) => t.priority === priority);
    const met = group.filter(
      (t) => t.resolved_at && t.resolution_time_seconds <= 86400
    );

    const avgResTime = Math.round(
      group.reduce((sum, t) => sum + t.resolution_time_seconds, 0) / (group.length || 1)
    );

    const avgRespTime = Math.round(
      group.reduce((sum, t) => sum + t.response_time_seconds, 0) / (group.length || 1)
    );

    return {
      priority,
      percentMet: group.length
        ? Math.round((met.length / group.length) * 100)
        : 0,
      avgResolution: avgResTime,
      avgResponse: avgRespTime,
    };
  });

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

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold mb-1">SLA Report</h2>
          <p className="text-sm text-muted-foreground">{reportPeriod}</p>
        </div>
        <Tabs defaultValue={selectedMetric} onValueChange={(v) => setSelectedMetric(v as any)} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="percentMet">% SLA Met</TabsTrigger>
            <TabsTrigger value="avgResponse">Avg. Response</TabsTrigger>
            <TabsTrigger value="avgResolution">Avg. Resolution</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Card - spans 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>SLA Performance</CardTitle>
            <CardDescription>Per Priority</CardDescription>
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
                      dataKey={selectedMetric}
                      fill={chartConfig[selectedMetric].color}
                      radius={4}
                      label={<SmartLabel />}
                    />
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
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Overall % SLA Met</p>
              <p className="text-xl font-semibold">
                {tickets.length ? Math.round((slaMetTickets.length / tickets.length) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg. Response Time</p>
              <p className="text-xl font-semibold">{avgResponse}s</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg. Resolution Time</p>
              <p className="text-xl font-semibold">{avgResolution}s</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
