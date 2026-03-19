import { http } from "@/core/infrastructure";
import type {
  ListProjectsParams,
  ProjectListResponse,
  ProjectMutationResponse,
  CreateProjectData,
  UpdateProjectData,
} from "./entity";

export async function listProjects(
  params: ListProjectsParams = {},
): Promise<ProjectListResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.sort) query.set("sort", params.sort);
  if (params.order) query.set("order", params.order);
  if (params.clientId) query.set("clientId", params.clientId);
  const qs = query.toString();
  return http<ProjectListResponse>(`/api/projects${qs ? `?${qs}` : ""}`);
}

export async function createProject(
  data: CreateProjectData,
): Promise<ProjectMutationResponse> {
  return http<ProjectMutationResponse>("/api/projects", {
    method: "POST",
    body: data,
  });
}

export async function updateProject(
  projectId: string,
  data: UpdateProjectData,
): Promise<ProjectMutationResponse> {
  return http<ProjectMutationResponse>(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  return http<void>(`/api/projects/${projectId}`, { method: "DELETE" });
}
