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
        <h2 className="font-display text-foreground text-lg font-semibold">Recent Projects</h2>
        <Link
          href="/client-portal/projects"
          className="text-primary flex items-center gap-1 text-sm hover:underline"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>

      <div className="rounded-card border-border bg-card shadow-cf-1 overflow-hidden border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border bg-secondary/50 border-b">
              <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold">
                Project
              </th>
              <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold">
                Status
              </th>
              <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold md:table-cell">
                Due Date
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr
                key={p.id}
                className="border-border hover:bg-secondary/30 border-b transition-colors last:border-0"
              >
                <td className="text-foreground px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-pill inline-flex items-center px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status] ?? "bg-secondary text-muted-foreground"}`}
                  >
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {p.dueDate ? (
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Clock size={11} />
                      {new Date(p.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/client-portal/projects/${p.id}`}
                    className="text-primary text-xs hover:underline"
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
