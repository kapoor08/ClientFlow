import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { RecentProject } from "@/core/analytics/entity";

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-blue-400",
  active: "bg-emerald-500",
  in_progress: "bg-primary",
  on_hold: "bg-amber-400",
  completed: "bg-green-600",
  cancelled: "bg-muted-foreground",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-500",
  high: "text-orange-500",
  medium: "text-amber-500",
  low: "text-muted-foreground",
};

export function RecentProjectRow({ project }: { project: RecentProject }) {
  const dotColor = STATUS_COLORS[project.status] ?? "bg-muted-foreground";
  const priorityColor = project.priority
    ? (PRIORITY_COLORS[project.priority] ?? "")
    : "";
  const due = project.dueDate ? new Date(project.dueDate) : null;
  const isOverdue =
    due && due < new Date() && project.status !== "completed";

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-medium text-foreground hover:text-primary truncate transition-colors"
        >
          {project.name}
        </Link>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
        {project.priority && (
          <span className={`font-medium capitalize ${priorityColor}`}>
            {project.priority}
          </span>
        )}
        {due && (
          <span className={isOverdue ? "text-red-500 font-medium" : ""}>
            {due.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-foreground transition-colors"
        >
          <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}
