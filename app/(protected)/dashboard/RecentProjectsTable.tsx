import Link from "next/link";
import { ArrowUpRight, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardProject } from "@/core/dashboard/entity";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
  PROJECT_PRIORITY_STYLES as PRIORITY_STYLES,
} from "@/core/projects/entity";

// ─── ProjectRow ───────────────────────────────────────────────────────────────

function ProjectRow({ project }: { project: DashboardProject }) {
  const statusLabel = PROJECT_STATUS_LABELS[project.status] ?? project.status;
  const statusStyle = PROJECT_STATUS_STYLES[project.status] ?? "bg-secondary text-muted-foreground";
  const priorityStyle = project.priority ? PRIORITY_STYLES[project.priority] : null;

  return (
    <tr className="group border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3">
        <Link
          href={`/projects/${project.id}`}
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          {project.name}
        </Link>
      </td>
      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
        {project.clientName ?? "-"}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
          {statusLabel}
        </span>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        {project.priority && priorityStyle ? (
          <span className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${priorityStyle}`}>
            {project.priority}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        {project.dueDate ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={11} />
            {new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary"
        >
          <ArrowRight size={14} />
        </Link>
      </td>
    </tr>
  );
}

// ─── RecentProjectsTable ──────────────────────────────────────────────────────

export function RecentProjectsTable({ recentProjects }: { recentProjects: DashboardProject[] }) {
  return (
    <div className="lg:col-span-3">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Recent Projects
        </h2>
        <Button variant="default" size="sm" asChild>
          <Link href="/projects" className="flex items-center gap-1">
            View All <ArrowUpRight size={14} />
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Project</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Priority</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">Due</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {recentProjects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No active projects yet.
                </td>
              </tr>
            ) : (
              recentProjects.map((p) => <ProjectRow key={p.id} project={p} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
