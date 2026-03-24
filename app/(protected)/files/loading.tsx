import { Skeleton } from "@/components/ui/skeleton";

export default function FilesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>

      {/* Search */}
      <Skeleton className="h-9 w-64" />

      {/* Table */}
      <div className="overflow-hidden rounded-card border border-border">
        {/* Table header */}
        <div className="border-b border-border bg-secondary/40 px-4 py-3">
          <div className="flex gap-8">
            {[80, 180, 140, 120, 60, 80].map((w, i) => (
              <Skeleton key={i} className="h-3.5" style={{ width: w }} />
            ))}
          </div>
        </div>
        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-8 border-b border-border px-4 py-4 last:border-0"
          >
            {/* Actions */}
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
            {/* File name + icon */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
