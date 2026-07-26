import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock } from "lucide-react";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { getPortalProjectDetailForUser } from "@/server/client-portal";
import { PortalTasksPanel } from "@/components/client-portal/project-detail/PortalTasksPanel";
import { PortalFilesPanel } from "@/components/client-portal/project-detail/PortalFilesPanel";
import {
  STATUS_STYLES,
  STATUS_LABELS,
} from "@/components/client-portal/project-detail/status-config";

export default async function ClientPortalProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx || ctx.roleKey !== "client") redirect("/dashboard");

  const detail = await getPortalProjectDetailForUser(session.user.id, projectId);
  if (!detail) notFound();

  const { project, tasks, files } = detail;

  return (
    <div>
      {/* Back */}
      <Link
        href="/client-portal/projects"
        className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ChevronLeft size={14} />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-foreground text-2xl font-semibold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm">{project.description}</p>
          )}
        </div>
        <span
          className={`rounded-pill mt-1 inline-flex shrink-0 items-center px-3 py-1 text-sm font-medium ${STATUS_STYLES[project.status] ?? "bg-secondary text-muted-foreground"}`}
        >
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
      </div>

      {/* Meta */}
      <div className="text-muted-foreground mb-8 flex flex-wrap gap-4 text-sm">
        {project.dueDate && (
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>
              Due{" "}
              {new Date(project.dueDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
        {project.clientName && (
          <div className="text-muted-foreground flex items-center gap-1.5">
            <span className="text-foreground font-medium">{project.clientName}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <PortalTasksPanel tasks={tasks} />
        <PortalFilesPanel files={files} />
      </div>
    </div>
  );
}
