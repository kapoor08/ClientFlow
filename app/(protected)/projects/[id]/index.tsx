import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Edit,
  FolderKanban,
} from "lucide-react";
import { getProjectDetailForUser } from "@/lib/projects";
import { getServerSession } from "@/lib/get-session";
import type { ProjectStatus, ProjectPriority } from "@/lib/projects-shared";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

const statusStyles: Record<ProjectStatus, string> = {
  planning: "bg-neutral-200/70 text-neutral-700",
  active: "bg-info/10 text-info",
  in_progress: "bg-primary/10 text-primary",
  on_hold: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-neutral-200/70 text-neutral-500",
};

const priorityStyles: Record<ProjectPriority, string> = {
  low: "bg-neutral-200/70 text-neutral-600",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-danger/10 text-danger",
};

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatCurrency(cents: number | null): string {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const session = await getServerSession();
  const { id } = await params;

  const { access, project } = await getProjectDetailForUser(
    session!.user.id,
    id,
  );

  if (!access) {
    redirect("/unauthorized");
  }
  if (!project) {
    notFound();
  }

  const isOverdue =
    project.dueDate &&
    project.status !== "completed" &&
    project.status !== "cancelled" &&
    project.dueDate < new Date();

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back + actions */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to Projects
        </Link>
        {access.canWrite && (
          <Link
            href={`/projects/${project.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-secondary"
          >
            <Edit size={13} />
            Edit
          </Link>
        )}
      </div>

      {/* Header card */}
      <div className="mb-4 rounded-card border border-border bg-card p-6 shadow-cf-1">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100">
            <FolderKanban size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-foreground">
                {project.name}
              </h1>
              <span
                className={`rounded-pill px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[project.status]}`}
              >
                {project.status.replaceAll("_", " ")}
              </span>
              {project.priority && (
                <span
                  className={`rounded-pill px-2.5 py-0.5 text-xs font-medium capitalize ${priorityStyles[project.priority]}`}
                >
                  {project.priority}
                </span>
              )}
            </div>
            <Link
              href={`/clients/${project.clientId}`}
              className="mt-1 block text-sm text-muted-foreground hover:text-primary"
            >
              {project.clientName}
            </Link>
          </div>
        </div>

        {project.description && (
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Start date */}
        <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={14} />
            <span className="text-xs font-medium uppercase tracking-wide">
              Start Date
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">
            {formatDate(project.startDate)}
          </p>
        </div>

        {/* Due date */}
        <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={14} />
            <span className="text-xs font-medium uppercase tracking-wide">
              Due Date
            </span>
          </div>
          <p
            className={`mt-2 text-sm font-medium ${
              isOverdue ? "text-danger" : "text-foreground"
            }`}
          >
            {formatDate(project.dueDate)}
            {isOverdue && (
              <span className="ml-2 text-[10px] font-normal">Overdue</span>
            )}
          </p>
        </div>

        {/* Budget */}
        <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign size={14} />
            <span className="text-xs font-medium uppercase tracking-wide">
              Budget
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">
            {formatCurrency(project.budgetCents)}
          </p>
        </div>
      </div>

      {/* Meta */}
      <p className="mt-4 text-right text-xs text-muted-foreground">
        Last updated {formatDate(project.updatedAt)}
      </p>
    </div>
  );
}
