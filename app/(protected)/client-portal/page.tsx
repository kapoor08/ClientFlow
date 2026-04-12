import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { getPortalHomeForUser } from "@/server/client-portal";
import {
  FolderKanban,
  CheckSquare,
  FileText,
  AlertCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES } from "@/core/projects/entity";

// Portal-specific override: legacy "active" key (canonical uses "in_progress")
const STATUS_STYLES: Record<string, string> = { ...PROJECT_STATUS_STYLES, active: "bg-info/10 text-info" };
const STATUS_LABELS: Record<string, string> = { ...PROJECT_STATUS_LABELS, active: "Active" };

export default async function ClientPortalPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx || ctx.roleKey !== "client") redirect("/dashboard");

  const summary = await getPortalHomeForUser(session.user.id);
  if (!summary) redirect("/dashboard");

  const stats = [
    {
      label: "Total Projects",
      value: summary.totalProjects,
      icon: FolderKanban,
      href: "/client-portal/projects",
      sub: `${summary.activeProjects} active`,
    },
    {
      label: "Open Tasks",
      value: summary.openTasks,
      icon: CheckSquare,
      href: "/client-portal/tasks",
      sub:
        summary.overdueTasks > 0
          ? `${summary.overdueTasks} overdue`
          : "All on track",
      warn: summary.overdueTasks > 0,
    },
    {
      label: "Files Shared",
      value: summary.totalFiles,
      icon: FileText,
      href: "/client-portal/files",
      sub: "Across all projects",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Welcome{summary.clientName ? `, ${summary.clientName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your project overview with {summary.orgName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-card border border-border bg-card p-5 shadow-cf-1 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {s.label}
              </span>
              <s.icon size={18} className="text-muted-foreground" />
            </div>
            <div className="font-display text-3xl font-bold text-foreground">
              {s.value}
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span
                className={`text-xs ${s.warn ? "text-warning font-medium flex items-center gap-1" : "text-muted-foreground"}`}
              >
                {s.warn && <AlertCircle size={11} />}
                {s.sub}
              </span>
              <ArrowRight
                size={14}
                className="text-muted-foreground/0 group-hover:text-muted-foreground transition-colors"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Projects */}
      {summary.recentProjects.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Recent Projects
            </h2>
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
                {summary.recentProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {p.name}
                    </td>
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
      )}
    </div>
  );
}
