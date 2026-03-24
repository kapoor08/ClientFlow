import { Skeleton } from "@/components/ui/skeleton";

export default function SecurityLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 space-y-1.5">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Active Sessions heading */}
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-3.5 w-16" />
      </div>

      {/* Session cards */}
      <div className="mb-8 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-card border border-border bg-card p-4 shadow-cf-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-40" />
                    {i === 0 && <Skeleton className="h-4 w-14 rounded-full" />}
                  </div>
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              {i !== 0 && <Skeleton className="h-8 w-20 rounded-md" />}
            </div>
          </div>
        ))}
      </div>

      {/* Security note */}
      <div className="rounded-card border border-border bg-card p-4 shadow-cf-1">
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
