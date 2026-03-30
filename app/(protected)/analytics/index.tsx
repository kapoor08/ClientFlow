import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { getServerSession } from "@/lib/get-session";
import { getAnalyticsSummaryForUser } from "@/lib/analytics";
import { analyticsSearchParamsCache } from "@/core/analytics/searchParams";
import { resolveDateRange } from "@/core/analytics/entity";
import type { DatePreset } from "@/core/analytics/entity";
import { FilterBar } from "./FilterBar";
import { KpiGrid } from "./KpiGrid";
import { ChartsRow } from "./ChartsRow";
import { RecentProjectsSection } from "./RecentProjectsSection";

type AnalyticsPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

const AnalyticsPage = async ({ searchParams }: AnalyticsPageProps) => {
  const session = await getServerSession();
  const { datePreset, clientId } =
    analyticsSearchParamsCache.parse(await searchParams);

  const { dateFrom, dateTo } = resolveDateRange(datePreset as DatePreset);

  const serverSummary = await getAnalyticsSummaryForUser(session!.user.id, {
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    clientId: clientId || undefined,
  });

  if (!serverSummary) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No active organization found.</p>
      </div>
    );
  }

  // Serialize Dates to ISO strings for client components
  const summary = {
    ...serverSummary,
    recentProjects: serverSummary.recentProjects.map((p) => ({
      ...p,
      dueDate: p.dueDate instanceof Date ? p.dueDate.toISOString() : p.dueDate,
      updatedAt:
        p.updatedAt instanceof Date
          ? p.updatedAt.toISOString()
          : String(p.updatedAt),
    })),
  };

  const totalProjects = summary.projectsByStatus.reduce(
    (acc, r) => acc + r.total,
    0,
  );

  return (
    <ListPageLayout
      title="Analytics"
      description="Organizational performance overview"
    >
      <FilterBar />

      <KpiGrid summary={summary} />

      <ChartsRow
        summary={summary}
        totalProjects={totalProjects}
        datePreset={datePreset}
      />

      <RecentProjectsSection
        recentProjects={summary.recentProjects}
        clientId={clientId}
      />
    </ListPageLayout>
  );
};

export default AnalyticsPage;
