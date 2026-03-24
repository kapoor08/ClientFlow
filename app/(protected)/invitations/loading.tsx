import { Skeleton } from "@/components/ui/skeleton";

export default function InvitationsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-card border border-border">
        <div className="border-b border-border bg-secondary/50 px-4 py-3">
          <div className="flex gap-8">
            {[200, 80, 80, 80, 100].map((w, i) => (
              <Skeleton key={i} className="h-3.5" style={{ width: w }} />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-8 border-b border-border px-4 py-4 last:border-0"
          >
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-20 rounded-pill" />
            <Skeleton className="h-5 w-20 rounded-pill" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <div className="ml-auto flex gap-1">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
