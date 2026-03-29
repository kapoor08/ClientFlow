import type { PaginationMeta } from "@/lib/pagination";

export type TaskListItem = {
  id: string;
  title: string;
  projectId: string;
  projectName: string | null;
  status: string;
  priority: string | null;
  assigneeUserId: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  estimateMinutes: number | null;
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
  columnId: string | null;
  refNumber: string | null;
  tags: string[];
};

export type TaskListResponse = {
  tasks: TaskListItem[];
  pagination: PaginationMeta;
};

export type TaskFilters = {
  q?: string;
  status?: string;
  priority?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
};

export type CreateTaskData = {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string | null;
  assigneeUserId?: string | null;
  dueDate?: string | null;
  estimateMinutes?: number | null;
  columnId?: string | null;
  tags?: string[];
  parentTaskId?: string | null;
  reporterUserId?: string | null;
};

export type UpdateTaskData = CreateTaskData & { status: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDueShort(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(5, 10); // MM-DD
}

export const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-neutral-300/50 text-neutral-700",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-danger/10 text-danger",
};

export const STATUS_BADGE: Record<string, string> = {
  todo: "bg-neutral-300/50 text-neutral-700",
  in_progress: "bg-info/10 text-info",
  review: "bg-warning/10 text-warning",
  blocked: "bg-danger/10 text-danger",
  done: "bg-success/10 text-success",
};
