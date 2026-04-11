import Link from "next/link";
import { ArrowUpRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardActivity } from "@/core/dashboard/entity";
import { formatActivity } from "@/core/dashboard/entity";
import { formatTimeAgo } from "@/utils/date";
import { getInitials } from "@/utils/user";

// ─── ActivityItem ─────────────────────────────────────────────────────────────

function ActivityItem({ item }: { item: DashboardActivity }) {
  const initials = getInitials(item.actorName);

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary mt-0.5">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{item.actorName ?? "Someone"}</span>
          {" "}
          <span className="text-muted-foreground">{formatActivity(item.action)}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatTimeAgo(item.createdAt)}</p>
      </div>
    </div>
  );
}

// ─── RecentActivityList ───────────────────────────────────────────────────────

export function RecentActivityList({ recentActivity }: { recentActivity: DashboardActivity[] }) {
  return (
    <div className="lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Activity size={16} />
          Recent Activity
        </h2>
        <Button variant="default" size="sm" asChild>
          <Link href="/activity-logs" className="flex items-center gap-1">
            View All <ArrowUpRight size={14} />
          </Link>
        </Button>
      </div>

      <div className="rounded-card border border-border bg-card shadow-cf-1 px-4 py-1">
        {recentActivity.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          recentActivity.map((item) => <ActivityItem key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
