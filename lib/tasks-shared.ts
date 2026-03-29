import { z } from "zod";

export const TASK_STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
] as const;

export const TASK_PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

export type TaskStatus = (typeof TASK_STATUS_OPTIONS)[number]["value"];
export type TaskPriority = (typeof TASK_PRIORITY_OPTIONS)[number]["value"];

const taskStatusValues = TASK_STATUS_OPTIONS.map((o) => o.value) as [
  TaskStatus,
  ...TaskStatus[],
];

const taskPriorityValues = TASK_PRIORITY_OPTIONS.map((o) => o.value) as [
  TaskPriority,
  ...TaskPriority[],
];

export const TASK_TAG_OPTIONS = [
  "bug",
  "enhancement",
  "feature",
  "improvement",
  "question",
  "documentation",
  "design",
  "blocked",
] as const;

export const taskFormSchema = z.object({
  projectId: z.string().min(1, "Project is required."),
  title: z
    .string()
    .min(1, "Title is required.")
    .max(500, "Title must be 500 characters or fewer."),
  description: z.string().max(5000).optional().default(""),
  status: z.enum(taskStatusValues).default("todo"),
  priority: z.enum(taskPriorityValues).nullable().default(null),
  assigneeUserId: z.string().nullable().default(null),
  dueDate: z.date().nullable().default(null),
  estimateMinutes: z.number().int().positive().nullable().default(null),
  columnId: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  parentTaskId: z.string().nullable().optional(),
  reporterUserId: z.string().nullable().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
