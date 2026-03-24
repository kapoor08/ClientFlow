import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Toolbar (search + view toggle) */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-card border border-border">
        {/* Table header */}
        <div className="border-b border-border bg-secondary/40 px-4 py-3">
          <div className="flex gap-8">
            {[80, 160, 120, 100, 80, 100, 100].map((w, i) => (
              <Skeleton key={i} className="h-3.5" style={{ width: w }} />
            ))}
          </div>
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-8 border-b border-border px-4 py-4 last:border-0"
          >
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-24 rounded-pill" />
            <Skeleton className="h-5 w-20 rounded-pill" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
