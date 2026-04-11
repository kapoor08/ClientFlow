export const PROJECT_STATUS_VALUES = [
  "planning",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const;

export const PROJECT_PRIORITY_VALUES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number];
export type ProjectPriority = (typeof PROJECT_PRIORITY_VALUES)[number];

export const PROJECT_STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const PROJECT_PRIORITY_OPTIONS: Array<{ value: ProjectPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const PROJECT_TEMPLATE_STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
] as const;

export const PROJECT_TEMPLATE_PRIORITY_OPTIONS = [
  { value: "none", label: "No priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> =
  Object.fromEntries(
    PROJECT_STATUS_OPTIONS.map(({ value, label }) => [value, label]),
  ) as Record<ProjectStatus, string>;
