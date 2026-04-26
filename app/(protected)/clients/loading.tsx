import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="rounded-card border-border overflow-hidden border">
        <div className="border-border bg-secondary/40 border-b px-4 py-3">
          <div className="flex gap-8">
            {[160, 200, 120, 100, 100].map((w, i) => (
              <Skeleton key={i} className="h-3.5" style={{ width: w }} />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border-border flex items-center gap-8 border-b px-4 py-4 last:border-0"
          >
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="rounded-pill h-5 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
