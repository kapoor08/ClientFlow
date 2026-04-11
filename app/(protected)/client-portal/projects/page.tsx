import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { getPortalProjectsForUser } from "@/lib/client-portal";
import { FolderKanban, Clock } from "lucide-react";
import Link from "next/link";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
  PROJECT_PRIORITY_STYLES as PRIORITY_STYLES,
} from "@/core/projects/entity";
import { EmptyState } from "@/components/common";

// Portal-specific override: legacy "active" key (canonical uses "in_progress")
const STATUS_STYLES: Record<string, string> = { ...PROJECT_STATUS_STYLES, active: "bg-info/10 text-info" };
const STATUS_LABELS: Record<string, string> = { ...PROJECT_STATUS_LABELS, active: "Active" };

export default async function ClientPortalProjectsPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx || ctx.roleKey !== "client") redirect("/dashboard");

  const projects = await getPortalProjectsForUser(session.user.id);
  if (!projects) redirect("/dashboard");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Projects
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {projects.length} project{projects.length !== 1 ? "s" : ""} shared with you
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Projects shared with you will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/client-portal/projects/${project.id}`}
              className="group rounded-card border border-border bg-card p-5 shadow-cf-1 hover:border-primary/50 transition-colors"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <span
                  className={`shrink-0 inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[project.status] ?? "bg-secondary text-muted-foreground"}`}
                >
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
              </div>

              {project.description && (
                <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {project.priority && (
                  <span
                    className={`inline-flex items-center rounded-pill px-2 py-0.5 font-medium capitalize ${PRIORITY_STYLES[project.priority] ?? ""}`}
                  >
                    {project.priority}
                  </span>
                )}
                {project.dueDate && (
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock size={11} />
                    {new Date(project.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
