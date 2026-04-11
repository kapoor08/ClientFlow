import { z } from "zod";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_TAG_VALUES,
  type TaskPriority,
  type TaskStatus,
} from "@/helpers/task";
export { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS };
export type { TaskPriority, TaskStatus };

const taskStatusValues = TASK_STATUS_OPTIONS.map((o) => o.value) as [
  TaskStatus,
  ...TaskStatus[],
];

const taskPriorityValues = TASK_PRIORITY_OPTIONS.map((o) => o.value) as [
  TaskPriority,
  ...TaskPriority[],
];

export const TASK_TAG_OPTIONS = TASK_TAG_VALUES;

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
