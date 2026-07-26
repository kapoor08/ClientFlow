import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES } from "@/core/projects/entity";
import { TASK_STATUS_LABELS, STATUS_BADGE as TASK_STATUS_STYLES } from "@/core/tasks/entity";

// Union of project + task statuses (the portal detail page renders both), plus
// the legacy "active" alias.
export const STATUS_STYLES: Record<string, string> = {
  ...PROJECT_STATUS_STYLES,
  ...TASK_STATUS_STYLES,
  active: "bg-info/10 text-info",
};

export const STATUS_LABELS: Record<string, string> = {
  ...PROJECT_STATUS_LABELS,
  ...TASK_STATUS_LABELS,
  active: "Active",
};
