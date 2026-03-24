import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogsLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 space-y-1.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-60" />
      </div>

      {/* Search bar */}
      <div className="mb-4 max-w-sm">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {[
                { label: "Timestamp", cls: "" },
                { label: "Actor", cls: "" },
                { label: "Action", cls: "" },
                { label: "Entity", cls: "hidden md:table-cell" },
                { label: "IP", cls: "hidden lg:table-cell" },
                { label: "User Agent", cls: "hidden xl:table-cell" },
              ].map(({ label, cls }) => (
                <th
                  key={label}
                  className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground ${cls}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-3"><Skeleton className="h-3 w-28" /></td>
                <td className="px-4 py-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-32 rounded-full" /></td>
                <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-3 w-20" /></td>
                <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="h-3 w-24" /></td>
                <td className="hidden px-4 py-3 xl:table-cell"><Skeleton className="h-3 w-40" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
