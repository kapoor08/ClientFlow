import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit,
  Paperclip,
  Pencil,
  Tag,
} from "lucide-react";
import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { FileUploader } from "@/components/files/FileUploader";
import { ProjectTasksSection, ProjectTimesheetSection } from "@/components/projects";
import { getProjectDetailForUser } from "@/server/projects";
import { getServerSession } from "@/server/auth/session";
import {
  BUDGET_TYPE_OPTIONS,
  type ProjectStatus,
  type ProjectPriority,
  type ProjectBudgetType,
} from "@/schemas/projects";
import { formatDate } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

const statusStyles: Record<ProjectStatus, string> = {
  planning: "bg-neutral-200/70 text-neutral-700",
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

const priorityDot: Record<ProjectPriority, string> = {
  low: "bg-neutral-400",
  medium: "bg-info",
  high: "bg-warning",
  urgent: "bg-danger",
};

function getBudgetTypeLabel(type: ProjectBudgetType | null): string {
  if (!type) return "-";
  return BUDGET_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
};

function StatCard({ icon, label, value, valueClassName }: StatCardProps) {
  return (
    <div className="rounded-card border-border bg-card shadow-cf-1 border p-5">
      <div className="text-muted-foreground flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-semibold tracking-wider uppercase">{label}</span>
      </div>
      <div className={`mt-2.5 text-sm font-semibold ${valueClassName ?? "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const session = await getServerSession();
  const { id } = await params;
  const { project } = await getProjectDetailForUser(session!.user.id, id);
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const session = await getServerSession();
  const { id } = await params;

  const { access, project } = await getProjectDetailForUser(session!.user.id, id);

  if (!access) redirect("/unauthorized");
  if (!project) notFound();

  const isOverdue =
    project.dueDate &&
    project.status !== "completed" &&
    project.status !== "cancelled" &&
    project.dueDate < new Date();

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Projects", href: "/projects" }, { label: project.name }]}
        className="mb-4"
      />

      <ListPageLayout
        title={
          <span className="flex flex-wrap items-center gap-2">
            {project.name}
            <span
              className={`rounded-pill px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[project.status]}`}
            >
              {project.status.replaceAll("_", " ")}
            </span>
            {project.priority && (
              <span
                className={`rounded-pill inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium capitalize ${priorityStyles[project.priority]}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[project.priority]}`} />
                {project.priority}
              </span>
            )}
          </span>
        }
        description={
          <Link
            href={`/clients/${project.clientId}`}
            className="hover:text-primary flex items-center gap-1 transition-colors"
          >
            <Building2 size={12} />
            {project.clientName}
          </Link>
        }
        action={
          access.canWrite ? (
            <Link
              href={`/projects/${project.id}/edit`}
              className="border-border bg-card hover:bg-secondary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
            >
              <Edit size={13} /> Edit
            </Link>
          ) : undefined
        }
      >
        <div className="space-y-5">
          {project.description && (
            <p className="text-muted-foreground flex items-start gap-2 text-sm leading-relaxed">
              <Pencil size={13} className="text-muted-foreground/50 mt-0.5 shrink-0" />
              {project.description}
            </p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={<Calendar size={13} />}
              label="Start Date"
              value={formatDate(project.startDate)}
            />
            <StatCard
              icon={<Calendar size={13} />}
              label="Due Date"
              value={
                <span className="flex items-center gap-1.5">
                  {formatDate(project.dueDate)}
                  {isOverdue && (
                    <span className="rounded-pill bg-danger/10 text-danger px-1.5 py-0.5 text-[10px] font-medium">
                      Overdue
                    </span>
                  )}
                </span>
              }
              valueClassName={isOverdue ? "text-danger" : undefined}
            />
            <StatCard
              icon={<DollarSign size={13} />}
              label="Budget"
              value={formatCurrency(project.budgetCents)}
            />
            <StatCard
              icon={<Tag size={13} />}
              label="Billing Model"
              value={getBudgetTypeLabel(project.budgetType)}
            />
          </div>

          {/* Completed date - only when relevant */}
          {project.completedAt && (
            <div className="rounded-card border-success/30 bg-success/5 text-success flex items-center gap-2 border px-4 py-3 text-sm">
              <CheckCircle2 size={15} />
              <span>
                Completed on <strong>{formatDate(project.completedAt)}</strong>
              </span>
            </div>
          )}

          {/* Tasks */}
          <ProjectTasksSection
            projectId={project.id}
            canWrite={access.canWrite}
            currentUserId={session!.user.id}
          />

          {/* Timesheet */}
          <ProjectTimesheetSection projectId={project.id} />

          {/* Files */}
          <div className="rounded-card border-border bg-card shadow-cf-1 border">
            <div className="border-border flex items-center gap-2 border-b px-6 py-4">
              <Paperclip size={15} className="text-muted-foreground" />
              <span className="text-foreground text-sm font-semibold">Files</span>
            </div>
            <div className="p-6">
              <FileUploader projectId={project.id} canUpload={access.canWrite} />
            </div>
          </div>

          {/* Footer meta */}
          <p className="text-muted-foreground text-right text-xs">
            Last updated {formatDate(project.updatedAt)}
          </p>
        </div>
      </ListPageLayout>
    </div>
  );
}
