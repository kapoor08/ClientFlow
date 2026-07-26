import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderKanban, CheckSquare, FileText, AlertCircle, ArrowRight } from "lucide-react";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { getPortalHomeForUser } from "@/server/client-portal";
import { RecentProjectsSection } from "@/components/client-portal/RecentProjectsSection";

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
      sub: summary.overdueTasks > 0 ? `${summary.overdueTasks} overdue` : "All on track",
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
        <h1 className="font-display text-foreground text-2xl font-semibold">
          Welcome{summary.clientName ? `, ${summary.clientName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your project overview with {summary.orgName}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-card border-border bg-card shadow-cf-1 hover:border-primary/50 border p-5 transition-colors"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">{s.label}</span>
              <s.icon size={18} className="text-muted-foreground" />
            </div>
            <div className="font-display text-foreground text-3xl font-bold">{s.value}</div>
            <div className="mt-1.5 flex items-center justify-between">
              <span
                className={`text-xs ${s.warn ? "text-warning flex items-center gap-1 font-medium" : "text-muted-foreground"}`}
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
        <RecentProjectsSection projects={summary.recentProjects} />
      )}
    </div>
  );
}
