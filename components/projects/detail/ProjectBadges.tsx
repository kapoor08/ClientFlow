import type { ProjectStatus, ProjectPriority } from "@/schemas/projects";

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

/** Status pill + optional priority pill, as shown in the project detail title. */
export function ProjectBadges({
  status,
  priority,
}: {
  status: ProjectStatus;
  priority: ProjectPriority | null;
}) {
  return (
    <>
      <span
        className={`rounded-pill px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[status]}`}
      >
        {status.replaceAll("_", " ")}
      </span>
      {priority && (
        <span
          className={`rounded-pill inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium capitalize ${priorityStyles[priority]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[priority]}`} />
          {priority}
        </span>
      )}
    </>
  );
}
