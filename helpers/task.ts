export const TASK_STATUS_VALUES = [
  "todo",
  "in_progress",
  "review",
  "blocked",
  "done",
] as const;

export const TASK_PRIORITY_VALUES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export type TaskStatus = (typeof TASK_STATUS_VALUES)[number];
export type TaskPriority = (typeof TASK_PRIORITY_VALUES)[number];

export const TASK_STATUS_OPTIONS: Array<{
  value: TaskStatus;
  label: string;
  color: string;
}> = [
  { value: "todo", label: "To Do", color: "#3b82f6" },
  { value: "in_progress", label: "In Progress", color: "#f59e0b" },
  { value: "review", label: "Review", color: "#8b5cf6" },
  { value: "blocked", label: "Blocked", color: "#ef4444" },
  { value: "done", label: "Done", color: "#10b981" },
];

export const TASK_PRIORITY_OPTIONS: Array<{
  value: TaskPriority;
  label: string;
  color: string;
}> = [
  { value: "low", label: "Low", color: "#71717a" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "urgent", label: "Urgent", color: "#ef4444" },
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> =
  Object.fromEntries(TASK_STATUS_OPTIONS.map(({ value, label }) => [value, label])) as Record<
    TaskStatus,
    string
  >;

export const TASK_TAG_VALUES = [
  "bug",
  "enhancement",
  "feature",
  "improvement",
  "question",
  "documentation",
  "design",
  "blocked",
] as const;

export type TaskTag = (typeof TASK_TAG_VALUES)[number];

export const TASK_TAG_OPTIONS: Array<{ value: TaskTag; label: string }> =
  TASK_TAG_VALUES.map((value) => ({
    value,
    label: value
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  }));

export const TASK_FILTER_STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "testing_qa", label: "Testing / QA" },
  { value: "completed", label: "Completed" },
  { value: "done", label: "Done" },
];

export const COLUMN_TYPE_OPTIONS = [
  { value: "none", label: "None (optional)" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "testing_qa", label: "Testing / QA" },
  { value: "completed", label: "Completed" },
];
