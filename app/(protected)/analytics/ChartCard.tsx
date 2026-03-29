import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectStatusBreakdown, MonthlyCount } from "@/core/analytics/entity";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ChartSkeleton() {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
      <Skeleton className="h-4 w-36 mb-6" />
      <div className="flex items-end gap-2 h-40">
        {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Monthly bar chart ────────────────────────────────────────────────────────

export function MonthlyChart({ data }: { data: MonthlyCount[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: 180 }}>
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-foreground">
            {d.total}
          </span>
          <div
            className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
            style={{ height: `${Math.max((d.total / max) * 140, 4)}px` }}
          />
          <span className="text-[10px] text-muted-foreground">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-blue-400",
  active: "bg-emerald-500",
  in_progress: "bg-primary",
  on_hold: "bg-amber-400",
  completed: "bg-green-600",
  cancelled: "bg-muted-foreground",
};

// ─── Status distribution ──────────────────────────────────────────────────────

export function StatusDistribution({
  data,
  total,
}: {
  data: ProjectStatusBreakdown[];
  total: number;
}) {
  const sorted = [...data].sort((a, b) => b.total - a.total);
  return (
    <div className="space-y-3">
      {sorted.map((row) => {
        const pct = total > 0 ? Math.round((row.total / total) * 100) : 0;
        const color = STATUS_COLORS[row.status] ?? "bg-muted-foreground";
        return (
          <div key={row.status}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-foreground">
                {STATUS_LABELS[row.status] ?? row.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {row.total} ({pct}%)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ChartCard wrapper ────────────────────────────────────────────────────────

export function ChartCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
      {children}
    </div>
  );
}
