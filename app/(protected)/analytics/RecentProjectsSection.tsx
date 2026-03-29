import Link from "next/link";
import { FolderKanban, Loader2 } from "lucide-react";
import type { RecentProject, AnalyticsFilters } from "@/core/analytics/entity";
import { RecentProjectRow } from "./RecentProjectRow";

export function RecentProjectsSection({
  summary,
  isLoading,
  filters,
}: {
  summary: { recentProjects: RecentProject[] } | undefined;
  isLoading: boolean;
  filters: AnalyticsFilters;
}) {
  return (
    <div className="mt-6 rounded-card border border-border bg-card shadow-cf-1">
      <div className="border-b border-border px-5 py-3.5 flex items-center gap-2">
        <FolderKanban size={16} className="text-muted-foreground" />
        <h2 className="font-display text-sm font-semibold text-foreground">
          Recent Projects
        </h2>
        <Link
          href={
            filters.clientId
              ? `/projects?clientId=${filters.clientId}`
              : "/projects"
          }
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>
      <div className="px-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : summary && summary.recentProjects.length > 0 ? (
          summary.recentProjects.map((p) => (
            <RecentProjectRow key={p.id} project={p} />
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No projects found.
          </p>
        )}
      </div>
    </div>
  );
}
