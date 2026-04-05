import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { getServerSession } from "@/lib/get-session";
import { getAnalyticsSummaryForUser } from "@/lib/analytics";
import { listClientsForUser } from "@/lib/clients";
import { analyticsSearchParamsCache } from "@/core/analytics/searchParams";
import { FilterBar } from "./FilterBar";
import { KpiGrid } from "./KpiGrid";
import { ChartsRow } from "./ChartsRow";
import { RecentProjectsSection } from "./RecentProjectsSection";

type AnalyticsPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

function formatDateLabel(dateFrom: string, dateTo: string) {
  if (!dateFrom && !dateTo) return "All time";

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (dateFrom && dateTo) {
    return `${formatter.format(new Date(dateFrom))} - ${formatter.format(new Date(dateTo))}`;
  }

  if (dateFrom) {
    return `From ${formatter.format(new Date(dateFrom))}`;
  }

  return `Until ${formatter.format(new Date(dateTo))}`;
}

const AnalyticsPage = async ({ searchParams }: AnalyticsPageProps) => {
  const session = await getServerSession();
  const { dateFrom, dateTo, clientId, priority } =
    analyticsSearchParamsCache.parse(await searchParams);
  const userId = session!.user.id;

  const [serverSummary, clientsResult] = await Promise.all([
    getAnalyticsSummaryForUser(userId, {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      clientId: clientId || undefined,
      priority: priority || undefined,
    }),
    listClientsForUser(userId, { pageSize: 500 }),
  ]);

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

  const totalInvoices = summary.invoicesByStatus.reduce(
    (acc, r) => acc + r.total,
    0,
  );

  return (
    <ListPageLayout
      title="Analytics"
      description="Organizational performance overview"
      action={
        <div className="flex justify-end">
          <FilterBar clients={clientsResult.clients} />
        </div>
      }
    >
      <KpiGrid summary={summary} />

      <ChartsRow
        summary={summary}
        totalProjects={totalProjects}
        totalInvoices={totalInvoices}
        dateLabel={formatDateLabel(dateFrom, dateTo)}
      />

      <RecentProjectsSection
        recentProjects={summary.recentProjects}
        clientId={clientId}
      />
    </ListPageLayout>
  );
};

export default AnalyticsPage;
