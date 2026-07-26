import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { getAdminAnalyticsData } from "@/server/admin/analytics";

type TopOrg = Awaited<ReturnType<typeof getAdminAnalyticsData>>["topOrgs"][number];

/** "Most Active Organizations" leaderboard panel. */
export function TopOrgsPanel({ topOrgs }: { topOrgs: TopOrg[] }) {
  return (
    <div className="border-border bg-card shadow-cf-1 overflow-hidden rounded-xl border">
      <div className="border-border border-b px-5 py-4">
        <h2 className="text-foreground text-sm font-semibold">Most Active Organizations</h2>
      </div>
      {topOrgs.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No data yet."
          className="rounded-none border-0 shadow-none"
        />
      ) : (
        <div className="divide-border divide-y">
          {topOrgs.map((org, i) => (
            <div key={org.id} className="flex items-center gap-3 px-5 py-3">
              <span className="text-muted-foreground w-5 shrink-0 text-xs font-bold">#{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">{org.name}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-foreground text-sm font-bold">
                  {Number(org.totalTasksCreated ?? 0).toLocaleString()}
                </p>
                <p className="text-muted-foreground text-[10px]">tasks created</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-foreground text-sm font-medium">
                  {Number(org.totalActiveUsers ?? 0).toLocaleString()}
                </p>
                <p className="text-muted-foreground text-[10px]">active user-days</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
