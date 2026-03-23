import { http } from "@/core/infrastructure";
import type {
  TaskFilters,
  TaskListResponse,
  CreateTaskData,
  UpdateTaskData,
} from "./entity";

export async function listTasks(
  filters: TaskFilters = {},
): Promise<TaskListResponse> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.projectId) params.set("projectId", filters.projectId);
  if (filters.page && filters.page > 1)
    params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return http<TaskListResponse>(`/api/tasks${qs ? `?${qs}` : ""}`);
}

export async function createTask(
  data: CreateTaskData,
): Promise<{ taskId: string }> {
  return http<{ taskId: string }>("/api/tasks", { method: "POST", body: data });
}

export async function updateTask(
  taskId: string,
  data: UpdateTaskData,
): Promise<{ taskId: string }> {
  return http<{ taskId: string }>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  return http<void>(`/api/tasks/${taskId}`, { method: "DELETE" });
}
