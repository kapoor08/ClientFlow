import { Skeleton } from "@/components/ui/skeleton";

export default function TeamsLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {["Member", "Role", "Status", "Projects", "Joined", ""].map((h, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground ${
                    i === 2 ? "hidden sm:table-cell" :
                    i === 3 ? "hidden md:table-cell" :
                    i === 4 ? "hidden lg:table-cell" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Skeleton className="h-3.5 w-6" />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <Skeleton className="h-3.5 w-24" />
                </td>
                <td className="px-4 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
