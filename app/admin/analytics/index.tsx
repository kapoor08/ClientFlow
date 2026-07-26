import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { PeriodSelector } from "@/components/admin/analytics/PeriodSelector";
import { PlatformStatsGrid } from "@/components/admin/analytics/PlatformStatsGrid";
import { CsvExportButton } from "@/components/admin/analytics/CsvExportButton";
import { EngagementPanel } from "@/components/admin/analytics/EngagementPanel";
import { TopOrgsPanel } from "@/components/admin/analytics/TopOrgsPanel";
import type {
  getAdminAnalyticsData,
  PlatformStats,
  MrrTrendRow,
  GrowthTrendRow,
  PlanDistributionRow,
} from "@/server/admin/analytics";

// recharts is heavy; load each chart chunk lazily so the analytics shell isn't
// blocked on the charting library. (App Router already keeps recharts off the
// global bundle; this splits it further behind a lazy boundary.)
const chartLoading = () => <Skeleton className="h-64 w-full" />;
const MrrTrendChart = dynamic(
  () => import("@/components/admin/analytics/MrrTrendChart").then((m) => m.MrrTrendChart),
  { loading: chartLoading },
);
const GrowthChart = dynamic(
  () => import("@/components/admin/analytics/GrowthChart").then((m) => m.GrowthChart),
  { loading: chartLoading },
);
const PlanDistributionChart = dynamic(
  () =>
    import("@/components/admin/analytics/PlanDistributionChart").then(
      (m) => m.PlanDistributionChart,
    ),
  { loading: chartLoading },
);

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
        <EngagementPanel dailyMetrics={dailyMetrics} totals={totals} />
      </div>

      {/* Top orgs */}
      <TopOrgsPanel topOrgs={topOrgs} />
    </div>
  );
}
