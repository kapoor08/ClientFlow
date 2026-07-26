import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { getAdminAnalyticsData } from "@/server/admin/analytics";

type DailyMetric = Awaited<ReturnType<typeof getAdminAnalyticsData>>["dailyMetrics"][number];

type EngagementPanelProps = {
  dailyMetrics: DailyMetric[];
  totals: { tasksCreated: number; tasksCompleted: number; activeUsers: number };
};

/** "Engagement - last 30 days" panel: summary tiles + a daily-metrics table. */
export function EngagementPanel({ dailyMetrics, totals }: EngagementPanelProps) {
  return (
    <div className="border-border bg-card shadow-cf-1 rounded-xl border lg:col-span-2">
      <div className="border-border flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-foreground text-sm font-semibold">Engagement - last 30 days</h2>
        <div className="flex gap-4">
          {[
            { label: "Tasks Created", value: totals.tasksCreated },
            { label: "Completed", value: totals.tasksCompleted },
            { label: "Active User-Days", value: totals.activeUsers },
          ].map(({ label, value }) => (
            <div key={label} className="text-right">
              <p className="text-foreground font-bold">{value.toLocaleString()}</p>
              <p className="text-muted-foreground text-[10px]">{label}</p>
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
                  <TableCell className="text-muted-foreground text-xs">
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
  );
}
