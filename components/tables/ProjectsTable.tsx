"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Calendar, FolderKanban } from "lucide-react";
import { DataTable, RowActions, type ColumnDef } from "@/components/data-table";
import { toast } from "sonner";
import { useDeleteProject } from "@/core/projects/useCase";
import type { PaginationMeta } from "@/lib/pagination";
import type { ProjectListItem } from "@/lib/projects";
import type { ProjectStatus, ProjectPriority } from "@/lib/projects-shared";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const statusStyles: Record<ProjectStatus, string> = {
  planning: "bg-neutral-200/70 text-neutral-700",
  active: "bg-info/10 text-info",
  in_progress: "bg-primary/10 text-primary",
  on_hold: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-neutral-200/70 text-neutral-500",
};

const statusIconBg: Record<ProjectStatus, string> = {
  planning: "bg-neutral-100 text-neutral-500",
  active: "bg-info/10 text-info",
  in_progress: "bg-primary/10 text-primary",
  on_hold: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-neutral-100 text-neutral-400",
};

const priorityStyles: Record<ProjectPriority, string> = {
  low: "bg-neutral-200/70 text-neutral-600",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-danger/10 text-danger",
};

const priorityDot: Record<ProjectPriority, string> = {
  low: "bg-neutral-400",
  medium: "bg-info",
  high: "bg-warning",
  urgent: "bg-danger",
};

function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex w-fit rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: ProjectPriority | null }) {
  if (!priority) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${priorityStyles[priority]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[priority]}`} />
      {priority}
    </span>
  );
}

// ─── Table columns ────────────────────────────────────────────────────────────

function buildColumns(
  canWrite: boolean,
  deletingId: string | null,
  onDelete: (projectId: string) => void,
): ColumnDef<ProjectListItem>[] {
  return [
    {
      key: "actions",
      header: "Actions",
      cell: (project) => (
        <RowActions
          viewHref={`/projects/${project.id}`}
          editHref={canWrite ? `/projects/${project.id}/edit` : undefined}
          onDelete={canWrite ? () => onDelete(project.id) : undefined}
          isDeleting={deletingId === project.id}
          deleteLabel={project.name}
        />
      ),
    },
    {
      key: "name",
      header: "Project",
      sortable: true,
      cell: (project) => (
        <Link href={`/projects/${project.id}`} className="flex flex-col">
          <span className="font-medium text-foreground hover:text-primary">
            {project.name}
          </span>
          <span className="text-xs text-muted-foreground md:hidden">
            {project.clientName}
          </span>
        </Link>
      ),
    },
    {
      key: "clientName",
      header: "Client",
      sortable: false,
      hideOnTablet: true,
      cell: (project) => (
        <Link
          href={`/clients/${project.clientId}`}
          className="text-sm text-muted-foreground hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          {project.clientName}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (project) => <StatusBadge status={project.status} />,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      hideOnMobile: true,
      cell: (project) => <PriorityBadge priority={project.priority} />,
    },
    {
      key: "startDate",
      header: "Start Date",
      sortable: false,
      hideOnTablet: true,
      cell: (project) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(project.startDate)}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortable: true,
      hideOnTablet: true,
      cell: (project) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(project.dueDate)}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      sortable: true,
      hideOnTablet: true,
      cell: (project) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(project.updatedAt)}
        </span>
      ),
    },
  ];
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function ProjectGridCard({ project }: { project: ProjectListItem }) {
  const isOverdue =
    project.dueDate &&
    project.status !== "completed" &&
    project.status !== "cancelled" &&
    new Date(project.dueDate) < new Date();

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col rounded-card border border-border bg-card shadow-cf-1 transition-all hover:border-primary/30 hover:shadow-cf-2"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-5 pb-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${statusIconBg[project.status]}`}
        >
          <FolderKanban size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {project.name}
          </h3>
          <Link
            href={`/clients/${project.clientId}`}
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Building2 size={10} className="shrink-0" />
            <span className="truncate">{project.clientName}</span>
          </Link>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Meta: priority + start date + due date */}
      <div className="mt-auto grid grid-cols-3 divide-x divide-border/60 border-t border-border/60">
        <div className="flex flex-col gap-1.5 px-4 py-3">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
            Priority
          </span>
          <PriorityBadge priority={project.priority} />
        </div>
        <div className="flex flex-col gap-1.5 px-4 py-3">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
            Start
          </span>
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Calendar size={11} className="shrink-0" />
            <span>{project.startDate ? formatDate(project.startDate) : "—"}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 px-4 py-3">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
            Due
          </span>
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              isOverdue
                ? "text-danger"
                : project.dueDate
                  ? "text-foreground"
                  : "text-muted-foreground"
            }`}
          >
            <Calendar size={11} className="shrink-0" />
            <span>{project.dueDate ? formatDate(project.dueDate) : "—"}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-b-card border-t border-border/60 bg-muted/20 px-5 py-2.5">
        <span className="text-[10px] text-muted-foreground">
          Updated {formatDate(project.updatedAt)}
        </span>
      </div>
    </Link>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

type ProjectsTableProps = {
  projects: ProjectListItem[];
  pagination: PaginationMeta;
  canWrite: boolean;
};

export function ProjectsTable({
  projects,
  pagination,
  canWrite,
}: ProjectsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteProject = useDeleteProject();

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId);
    try {
      await deleteProject.mutateAsync({ projectId });
      toast.success("Project deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = buildColumns(canWrite, deletingId, handleDelete);

  return (
    <DataTable
      data={projects}
      columns={columns}
      getRowKey={(p) => p.id}
      searchPlaceholder="Search projects…"
      pagination={pagination}
      gridCard={(project) => <ProjectGridCard project={project} />}
      gridCols={3}
      emptyTitle="No projects found."
      emptyDescription="Try a different search term or create your first project."
      emptyAction={
        canWrite ? (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Project
          </Link>
        ) : undefined
      }
    />
  );
}
