import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES } from "@/core/projects/entity";
import type { getPortalHomeForUser } from "@/server/client-portal";

// Portal home renders project statuses only (legacy "active" alias included).
const STATUS_STYLES: Record<string, string> = {
  ...PROJECT_STATUS_STYLES,
  active: "bg-info/10 text-info",
};
const STATUS_LABELS: Record<string, string> = { ...PROJECT_STATUS_LABELS, active: "Active" };

type RecentProject = NonNullable<
  Awaited<ReturnType<typeof getPortalHomeForUser>>
>["recentProjects"][number];

export function RecentProjectsSection({ projects }: { projects: RecentProject[] }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">Recent Projects</h2>
        <Link
          href="/client-portal/projects"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Project
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Due Date
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status] ?? "bg-secondary text-muted-foreground"}`}
                  >
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {p.dueDate ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={11} />
                      {new Date(p.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/client-portal/projects/${p.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
