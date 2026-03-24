import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 space-y-1.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex items-center gap-2.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-8 w-44 rounded-md" />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-border bg-card p-5 shadow-cf-1">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-7 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-card border border-border bg-card p-5 shadow-cf-1">
            <Skeleton className="h-4 w-36 mb-6" />
            <div className="flex items-end gap-2 h-44">
              {[40, 70, 50, 90, 60, 80, 55, 75].map((h, j) => (
                <Skeleton
                  key={j}
                  className="flex-1 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent projects */}
      <div className="mt-6 rounded-card border border-border bg-card shadow-cf-1">
        <div className="border-b border-border px-5 py-3.5 flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto h-3.5 w-12" />
        </div>
        <div className="px-5 divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
