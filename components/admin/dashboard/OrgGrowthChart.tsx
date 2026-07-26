import { format } from "date-fns";

export function OrgGrowthChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No new organizations in the last 30 days.</p>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.date} className="flex items-center gap-3">
          <span className="text-muted-foreground w-20 shrink-0 text-[11px] tabular-nums">
            {format(new Date(d.date), "MMM d")}
          </span>
          <div className="bg-secondary h-2 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary/60 h-full rounded-full"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-foreground w-4 shrink-0 text-right text-[11px] font-medium tabular-nums">
            {d.count}
          </span>
        </div>
      ))}
    </div>
  );
}
