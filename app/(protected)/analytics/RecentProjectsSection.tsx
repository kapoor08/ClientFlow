import Link from "next/link";
import { FolderKanban } from "lucide-react";
import type { RecentProject } from "@/core/analytics/entity";
import { RecentProjectRow } from "./RecentProjectRow";

export function RecentProjectsSection({
  recentProjects,
  clientId,
}: {
  recentProjects: RecentProject[];
  clientId: string;
}) {
  return (
    <div className="mt-6 rounded-card border border-border bg-card shadow-cf-1">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <FolderKanban size={16} className="text-muted-foreground" />
        <h2 className="font-display text-sm font-semibold text-foreground">
          Recent Projects
        </h2>
        <Link
          href={clientId ? `/projects?clientId=${clientId}` : "/projects"}
          className="ml-auto text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="px-5">
        {recentProjects.length > 0 ? (
          recentProjects.map((p) => <RecentProjectRow key={p.id} project={p} />)
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No projects found.
          </p>
        )}
      </div>
    </div>
  );
}
