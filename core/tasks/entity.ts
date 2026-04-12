import type { PaginationMeta } from "@/utils/pagination";
import { TASK_STATUS_LABELS } from "@/constants/task";

export type TaskAssignee = { userId: string; name: string | null };

export type TaskListItem = {
  id: string;
  title: string;
  projectId: string;
  projectName: string | null;
  status: string;
  priority: string | null;
  assigneeUserId: string | null;
  assigneeName: string | null;
  assignees: TaskAssignee[];
  dueDate: string | null;
  estimateMinutes: number | null;
  estimateSetAt: string | null;
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
  columnId: string | null;
  position: number;
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

export function formatDueShort(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
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

export { TASK_STATUS_LABELS };
