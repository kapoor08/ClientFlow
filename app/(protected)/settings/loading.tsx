import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 space-y-1.5">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="max-w-2xl space-y-6">
        {/* General section */}
        <div className="rounded-card border border-border bg-card p-6 shadow-cf-1">
          <Skeleton className="h-5 w-20 mb-4" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </div>

        {/* Localization section */}
        <div className="rounded-card border border-border bg-card p-6 shadow-cf-1">
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </div>

        {/* Authentication Policy section */}
        <div className="rounded-card border border-border bg-card p-6 shadow-cf-1">
          <Skeleton className="h-5 w-44 mb-4" />
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        </div>

        {/* Save button */}
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}
