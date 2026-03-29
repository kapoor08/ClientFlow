import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { getPortalProjectDetailForUser } from "@/lib/client-portal";
import {
  ChevronLeft,
  Clock,
  FileText,
  CheckSquare,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  planning: "bg-secondary text-muted-foreground",
  active: "bg-info/10 text-info",
  in_progress: "bg-info/10 text-info",
  on_hold: "bg-warning/10 text-warning",
  review: "bg-warning/10 text-warning",
  blocked: "bg-danger/10 text-danger",
  completed: "bg-success/10 text-success",
  done: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  in_progress: "In Progress",
  on_hold: "On Hold",
  review: "Review",
  blocked: "Blocked",
  completed: "Completed",
  done: "Done",
  cancelled: "Cancelled",
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const openTasks = tasks.filter((t) => !["done", "completed"].includes(t.status));
  const doneTasks = tasks.filter((t) => ["done", "completed"].includes(t.status));

  return (
    <div>
      {/* Back */}
      <Link
        href="/client-portal/projects"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={14} />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
              {project.description}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 mt-1 inline-flex items-center rounded-pill px-3 py-1 text-sm font-medium ${STATUS_STYLES[project.status] ?? "bg-secondary text-muted-foreground"}`}
        >
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
      </div>

      {/* Meta */}
      <div className="mb-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
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
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="font-medium text-foreground">{project.clientName}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Tasks */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <CheckSquare size={16} className="text-muted-foreground" />
            <h2 className="font-display text-base font-semibold text-foreground">
              Tasks
            </h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {openTasks.length} open · {doneTasks.length} done
            </span>
          </div>

          <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
            {tasks.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No tasks yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Task
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                      Due
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/30"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {task.title}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status] ?? "bg-secondary text-muted-foreground"}`}
                        >
                          {STATUS_LABELS[task.status] ?? task.status}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {task.dueDate ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock size={11} />
                            {new Date(task.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Files */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            <h2 className="font-display text-base font-semibold text-foreground">
              Files
            </h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {files.length}
            </span>
          </div>

          <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
            {files.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No files yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.sizeBytes)}
                        {file.sizeBytes ? " · " : ""}
                        {new Date(file.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <a
                      href={file.storageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
