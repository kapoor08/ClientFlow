import { Users, FolderOpen, Briefcase, CheckSquare, MessageSquare, Upload } from "lucide-react";
import type { BillingContext } from "@/core/billing/entity";
import { usagePercent } from "@/core/billing/entity";

// ─── UsageCard ────────────────────────────────────────────────────────────────

function UsageCard({
  icon: Icon,
  label,
  used,
  limit,
}: {
  icon: typeof Users;
  label: string;
  used: number;
  limit: number | null;
}) {
  const pct = usagePercent(used, limit);
  const isNearLimit = limit !== null && pct >= 80;

  return (
    <div className={`rounded-lg border bg-card p-4 ${isNearLimit ? "border-warning/50" : "border-border"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="font-display text-xl font-bold text-foreground">
        {used}
        {limit !== null && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / {limit}
          </span>
        )}
        {limit === null && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / ∞
          </span>
        )}
      </p>
      {limit !== null && (
        <div className="mt-2">
          <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isNearLimit ? "bg-warning" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={`mt-1 text-[10px] ${isNearLimit ? "text-warning" : "text-muted-foreground"}`}>
            {pct}% used
          </p>
        </div>
      )}
    </div>
  );
}

// ─── UsageSection ─────────────────────────────────────────────────────────────

export function UsageSection({ usage }: { usage: BillingContext["usage"] }) {
  return (
    <>
      <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
        Usage
      </h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <UsageCard
          icon={Users}
          label="Team Members"
          used={usage.members.used}
          limit={usage.members.limit}
        />
        <UsageCard
          icon={FolderOpen}
          label="Projects"
          used={usage.projects.used}
          limit={usage.projects.limit}
        />
        <UsageCard
          icon={Briefcase}
          label="Clients"
          used={usage.clients.used}
          limit={usage.clients.limit}
        />
      </div>

      <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
        This Month&apos;s Activity
      </h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <UsageCard
          icon={CheckSquare}
          label="Tasks Created"
          used={usage.tasksThisMonth.used}
          limit={usage.tasksThisMonth.limit}
        />
        <UsageCard
          icon={MessageSquare}
          label="Comments"
          used={usage.commentsThisMonth.used}
          limit={usage.commentsThisMonth.limit}
        />
        <UsageCard
          icon={Upload}
          label="File Uploads"
          used={usage.fileUploadsThisMonth.used}
          limit={usage.fileUploadsThisMonth.limit}
        />
      </div>
    </>
  );
}
