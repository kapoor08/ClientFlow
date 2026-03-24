import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-card border border-border bg-card p-5 shadow-cf-1"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Tasks Due Soon */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Task</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Due</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><Skeleton className="h-3.5 w-48" /></td>
                  <td className="hidden px-4 py-3 sm:table-cell"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-3.5 w-16" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
