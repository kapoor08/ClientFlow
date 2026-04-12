import { Skeleton } from "@/components/ui/skeleton";
import type {
  ProjectStatusBreakdown,
  MonthlyCount,
} from "@/core/analytics/entity";
import {
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from "@/constants/analytics";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ChartSkeleton() {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
      <Skeleton className="mb-6 h-4 w-36" />
      <div className="flex h-40 items-end gap-2">
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

export function MonthlyChart({
  data,
  color = "bg-primary/80 hover:bg-primary",
  unit,
}: {
  data: MonthlyCount[];
  color?: string;
  unit?: string;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: 180 }}>
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-foreground">
            {unit ? `${d.total}${unit}` : d.total}
          </span>
          <div
            className={`w-full rounded-t-md transition-colors ${color}`}
            style={{ height: `${Math.max((d.total / max) * 140, 4)}px` }}
          />
          <span className="text-[10px] text-muted-foreground">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

export function StatusDistribution({
  data,
  total,
  type = "project",
}: {
  data: ProjectStatusBreakdown[];
  total: number;
  type?: "project" | "task" | "invoice";
}) {
  const labels =
    type === "task"
      ? TASK_STATUS_LABELS
      : type === "invoice"
        ? INVOICE_STATUS_LABELS
        : PROJECT_STATUS_LABELS;

  const colors =
    type === "task"
      ? TASK_STATUS_COLORS
      : type === "invoice"
        ? INVOICE_STATUS_COLORS
        : PROJECT_STATUS_COLORS;

  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-3">
      {sorted.map((row) => {
        const pct = total > 0 ? Math.round((row.total / total) * 100) : 0;
        const color = colors[row.status] ?? "bg-muted-foreground";
        return (
          <div key={row.status}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {labels[row.status] ?? row.status}
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

export function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
      {children}
    </div>
  );
}
