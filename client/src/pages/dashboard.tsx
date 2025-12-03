import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { DashboardMetrics, ChartData } from "@shared/schema";

interface DashboardData {
  metrics: DashboardMetrics;
  charts: ChartData;
}

const CHART_COLORS = {
  primary: "hsl(142, 76%, 36%)",
  secondary: "hsl(210, 82%, 42%)",
  tertiary: "hsl(32, 88%, 48%)",
  quaternary: "hsl(280, 65%, 45%)",
};

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const metrics = data?.metrics;
  const charts = data?.charts;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your court booking business
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Today's Revenue"
          value={metrics?.todayRevenue}
          icon={DollarSign}
          prefix="PKR "
          isLoading={isLoading}
          color="primary"
        />
        <MetricCard
          title="Week Revenue"
          value={metrics?.weekRevenue}
          icon={TrendingUp}
          prefix="PKR "
          isLoading={isLoading}
          color="chart-2"
        />
        <MetricCard
          title="Total Bookings"
          value={metrics?.totalBookings}
          icon={Calendar}
          isLoading={isLoading}
          color="chart-4"
        />
        <MetricCard
          title="Court A Occupancy"
          value={metrics?.courtAOccupancy}
          icon={Activity}
          suffix="%"
          isLoading={isLoading}
          color="chart-3"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={charts?.revenueByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={formatCurrency}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number) => [`PKR ${value.toLocaleString()}`, "Revenue"]}
                    labelFormatter={(label) => format(new Date(label), "EEEE, MMM d")}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS.primary, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-chart-2" />
              Daily Bookings by Court
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts?.bookingsByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(label) => format(new Date(label), "EEEE, MMM d")}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="courtA"
                    name="Court A"
                    fill={CHART_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="courtB"
                    name="Court B"
                    fill={CHART_COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-chart-4" />
              Court Occupancy Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="hsl(var(--muted))"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke={CHART_COLORS.primary}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(metrics?.courtAOccupancy || 0) * 3.52} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold">
                      {metrics?.courtAOccupancy || 0}%
                    </span>
                  </div>
                  <p className="mt-2 font-medium">Court A</p>
                </div>
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="hsl(var(--muted))"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke={CHART_COLORS.secondary}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(metrics?.courtBOccupancy || 0) * 3.52} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold">
                      {metrics?.courtBOccupancy || 0}%
                    </span>
                  </div>
                  <p className="mt-2 font-medium">Court B</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-chart-3" />
              Bookings by Sport
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts?.occupancyByCourtAndSport || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="percentage"
                    nameKey="sport"
                    label={({ sport, percentage }) => `${sport}: ${percentage}%`}
                  >
                    <Cell fill={CHART_COLORS.primary} />
                    <Cell fill={CHART_COLORS.secondary} />
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Share"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  prefix?: string;
  suffix?: string;
  isLoading: boolean;
  color: string;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  prefix = "",
  suffix = "",
  isLoading,
  color,
}: MetricCardProps) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    "chart-2": "bg-chart-2/10 text-chart-2",
    "chart-3": "bg-chart-3/10 text-chart-3",
    "chart-4": "bg-chart-4/10 text-chart-4",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p className="text-3xl font-bold" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {prefix}
            {value?.toLocaleString() || 0}
            {suffix}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
