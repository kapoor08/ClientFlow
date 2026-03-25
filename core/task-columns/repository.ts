import { http } from "@/core/infrastructure";
import type { BoardColumnsResponse, CreateColumnData, UpdateColumnData } from "./entity";

export async function listColumns(): Promise<BoardColumnsResponse> {
  return http<BoardColumnsResponse>("/api/task-columns");
}

export async function createColumn(data: CreateColumnData): Promise<{ columnId: string }> {
  return http<{ columnId: string }>("/api/task-columns", { method: "POST", body: data });
}

export async function updateColumn(columnId: string, data: UpdateColumnData): Promise<void> {
  return http<void>(`/api/task-columns/${columnId}`, { method: "PATCH", body: data });
}

export async function deleteColumn(columnId: string): Promise<void> {
  return http<void>(`/api/task-columns/${columnId}`, { method: "DELETE" });
}

export async function reorderColumns(orderedIds: string[]): Promise<void> {
  return http<void>("/api/task-columns/reorder", { method: "PATCH", body: { orderedIds } });
}
