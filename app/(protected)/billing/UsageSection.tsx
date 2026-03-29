import { Users, FolderOpen, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="rounded-lg border border-border bg-card p-4">
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

export function UsageSection({
  usage,
  isLoading,
}: {
  usage: BillingContext["usage"] | undefined;
  isLoading: boolean;
}) {
  return (
    <>
      <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
        Usage
      </h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))
        ) : (
          <>
            <UsageCard
              icon={Users}
              label="Team Members"
              used={usage?.members.used ?? 0}
              limit={usage?.members.limit ?? null}
            />
            <UsageCard
              icon={FolderOpen}
              label="Projects"
              used={usage?.projects.used ?? 0}
              limit={usage?.projects.limit ?? null}
            />
            <UsageCard
              icon={Briefcase}
              label="Clients"
              used={usage?.clients.used ?? 0}
              limit={usage?.clients.limit ?? null}
            />
          </>
        )}
      </div>
    </>
  );
}
