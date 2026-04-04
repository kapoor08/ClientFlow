import { db } from "@/lib/db";
import { analyticsDailyOrgMetrics, organizations } from "@/db/schema";
import { desc, gte, eq, isNull, sum } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getAnalyticsData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [dailyMetrics, topOrgs] = await Promise.all([
    db
      .select({
        date: analyticsDailyOrgMetrics.metricDate,
        tasksCreated: sum(analyticsDailyOrgMetrics.tasksCreated),
        tasksCompleted: sum(analyticsDailyOrgMetrics.tasksCompleted),
        activeUsers: sum(analyticsDailyOrgMetrics.activeUsers),
      })
      .from(analyticsDailyOrgMetrics)
      .where(gte(analyticsDailyOrgMetrics.metricDate, thirtyDaysAgo))
      .groupBy(analyticsDailyOrgMetrics.metricDate)
      .orderBy(desc(analyticsDailyOrgMetrics.metricDate))
      .limit(30),

    db
      .select({
        id: organizations.id,
        name: organizations.name,
        createdAt: organizations.createdAt,
        totalTasksCreated: sum(analyticsDailyOrgMetrics.tasksCreated),
        totalActiveUsers: sum(analyticsDailyOrgMetrics.activeUsers),
      })
      .from(organizations)
      .leftJoin(analyticsDailyOrgMetrics, eq(analyticsDailyOrgMetrics.organizationId, organizations.id))
      .where(isNull(organizations.deletedAt))
      .groupBy(organizations.id, organizations.name, organizations.createdAt)
      .orderBy(desc(sum(analyticsDailyOrgMetrics.tasksCreated)))
      .limit(10),
  ]);

  return { dailyMetrics, topOrgs };
}

export default async function AdminAnalyticsPage() {
  const { dailyMetrics, topOrgs } = await getAnalyticsData();

  const totals = dailyMetrics.reduce(
    (acc, row) => ({
      tasksCreated: acc.tasksCreated + Number(row.tasksCreated ?? 0),
      tasksCompleted: acc.tasksCompleted + Number(row.tasksCompleted ?? 0),
      activeUsers: acc.activeUsers + Number(row.activeUsers ?? 0),
    }),
    { tasksCreated: 0, tasksCompleted: 0, activeUsers: 0 },
  );

  return (
    <div>
      <PageHeader title="Analytics" description="Platform engagement — last 30 days" />

      {/* 30-day totals */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Tasks Created", value: totals.tasksCreated },
          { label: "Tasks Completed", value: totals.tasksCompleted },
          { label: "Active User-Days", value: totals.activeUsers },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-cf-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              {label}
            </p>
            <p className="font-display text-2xl font-bold text-foreground">
              {value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily activity table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-cf-1">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold text-foreground text-sm">Daily Activity (last 30 days)</h2>
          </div>
          {dailyMetrics.length === 0 ? (
            <EmptyState icon={BarChart3} title="No data yet." className="rounded-none border-0 shadow-none" />
          ) : (
            <div className="max-h-96 overflow-auto">
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
                          ? new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-foreground">
                        {Number(row.tasksCreated ?? 0)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-foreground">
                        {Number(row.tasksCompleted ?? 0)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-foreground">
                        {Number(row.activeUsers ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Top organizations */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-cf-1">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold text-foreground text-sm">Most Active Organizations</h2>
          </div>
          {topOrgs.length === 0 ? (
            <EmptyState icon={BarChart3} title="No data yet." className="rounded-none border-0 shadow-none" />
          ) : (
            <div className="divide-y divide-border">
              {topOrgs.map((org, i) => (
                <div key={org.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">
                      {Number(org.totalTasksCreated ?? 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">tasks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
