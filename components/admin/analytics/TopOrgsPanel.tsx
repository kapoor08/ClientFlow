import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { getAdminAnalyticsData } from "@/server/admin/analytics";

type TopOrg = Awaited<ReturnType<typeof getAdminAnalyticsData>>["topOrgs"][number];

/** "Most Active Organizations" leaderboard panel. */
export function TopOrgsPanel({ topOrgs }: { topOrgs: TopOrg[] }) {
  return (
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
  );
}
