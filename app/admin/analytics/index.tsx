import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PeriodSelector,
  PlatformStatsGrid,
  MrrTrendChart,
  GrowthChart,
  PlanDistributionChart,
  CsvExportButton,
} from "@/components/admin/analytics";
import type {
  getAdminAnalyticsData,
  PlatformStats,
  MrrTrendRow,
  GrowthTrendRow,
  PlanDistributionRow,
} from "@/server/admin/analytics";

type Data = Awaited<ReturnType<typeof getAdminAnalyticsData>>;

type Props = {
  data: Data;
  stats: PlatformStats;
  mrrTrend: MrrTrendRow[];
  growthTrend: GrowthTrendRow[];
  planDistribution: PlanDistributionRow[];
  period: string;
  days: number;
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-cf-1">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AdminAnalyticsPage({
  data,
  stats,
  mrrTrend,
  growthTrend,
  planDistribution,
  period,
  days,
}: Props) {
  const { dailyMetrics, topOrgs } = data;

  const totals = dailyMetrics.reduce(
    (acc, row) => ({
      tasksCreated: acc.tasksCreated + Number(row.tasksCreated ?? 0),
      tasksCompleted: acc.tasksCompleted + Number(row.tasksCompleted ?? 0),
      activeUsers: acc.activeUsers + Number(row.activeUsers ?? 0),
    }),
    { tasksCreated: 0, tasksCompleted: 0, activeUsers: 0 },
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Analytics" description="Platform overview and engagement metrics" />
        <div className="flex items-center gap-2 shrink-0">
          <CsvExportButton />
          <PeriodSelector period={period} />
        </div>
      </div>

      {/* Platform KPI cards */}
      <PlatformStatsGrid stats={stats} days={days} />

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="New MRR by Month (last 12mo)">
          <MrrTrendChart data={mrrTrend} />
        </ChartCard>
        <ChartCard title="Growth Trend (last 6mo)">
          <GrowthChart data={growthTrend} />
        </ChartCard>
      </div>

      {/* Plan distribution + engagement stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Active Subscriptions by Plan">
          <PlanDistributionChart data={planDistribution} />
        </ChartCard>

        {/* Engagement KPIs - last 30 days from org-level metrics */}
        <div className="rounded-xl border border-border bg-card shadow-cf-1 lg:col-span-2">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Engagement - last 30 days</h2>
            <div className="flex gap-4">
              {[
                { label: "Tasks Created", value: totals.tasksCreated },
                { label: "Completed", value: totals.tasksCompleted },
                { label: "Active User-Days", value: totals.activeUsers },
              ].map(({ label, value }) => (
                <div key={label} className="text-right">
                  <p className="font-bold text-foreground">{value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {dailyMetrics.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No engagement data yet."
              className="rounded-none border-0 shadow-none"
            />
          ) : (
            <div className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Tasks Created</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Active Users</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyMetrics.map((row) => (
                    <TableRow key={row.date?.toISOString()}>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.date
                          ? new Date(row.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {Number(row.tasksCreated ?? 0)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {Number(row.tasksCompleted ?? 0)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {Number(row.activeUsers ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Top orgs */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-cf-1">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Most Active Organizations</h2>
        </div>
        {topOrgs.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No data yet."
            className="rounded-none border-0 shadow-none"
          />
        ) : (
          <div className="divide-y divide-border">
            {topOrgs.map((org, i) => (
              <div key={org.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 shrink-0 text-xs font-bold text-muted-foreground">
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{org.name}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-foreground">
                    {Number(org.totalTasksCreated ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">tasks created</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-foreground">
                    {Number(org.totalActiveUsers ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">active user-days</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
