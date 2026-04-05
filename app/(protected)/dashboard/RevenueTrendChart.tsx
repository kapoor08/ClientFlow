import { TrendingUp } from "lucide-react";
import { formatRevenue } from "@/core/dashboard/entity";
import type { RevenueTrendPoint } from "@/core/dashboard/entity";

export function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  const max = Math.max(...data.map((d) => d.revenueCents), 1);
  const hasData = data.some((d) => d.revenueCents > 0);

  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={15} className="text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Revenue Trend</p>
        <span className="ml-auto text-xs text-muted-foreground">Last 6 months</span>
      </div>

      {hasData ? (
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {data.map((d) => (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-foreground">
                {d.revenueCents > 0 ? formatRevenue(d.revenueCents) : ""}
              </span>
              <div
                className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                style={{ height: `${Math.max((d.revenueCents / max) * 120, d.revenueCents > 0 ? 4 : 2)}px` }}
              />
              <span className="text-[10px] text-muted-foreground">{d.month}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center gap-1">
          <p className="text-sm text-muted-foreground">No revenue data yet</p>
          <p className="text-xs text-muted-foreground">Paid invoices will appear here</p>
        </div>
      )}
    </div>
  );
}
