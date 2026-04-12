import type { MonthlyRevenue } from "@/core/analytics/entity";

export function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  const max = Math.max(...data.map((d) => d.totalCents), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: 180 }}>
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-foreground">
            {d.totalCents > 0
              ? `$${(d.totalCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
              : ""}
          </span>
          <div
            className="w-full rounded-t-md bg-emerald-500/80 hover:bg-emerald-500 transition-colors"
            style={{ height: `${Math.max((d.totalCents / max) * 140, 4)}px` }}
          />
          <span className="text-[10px] text-muted-foreground">{d.month}</span>
        </div>
      ))}
    </div>
  );
}
