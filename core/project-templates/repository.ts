import { http } from "@/core/infrastructure";
import type {
  ProjectTemplate,
  ProjectTemplateInput,
  ProjectTemplateListResponse,
} from "./entity";

export async function listProjectTemplates(): Promise<ProjectTemplateListResponse> {
  return http<ProjectTemplateListResponse>("/api/project-templates");
}

export async function createProjectTemplate(
  data: ProjectTemplateInput,
): Promise<{ template: ProjectTemplate }> {
  return http<{ template: ProjectTemplate }>("/api/project-templates", {
    method: "POST",
    body: data,
  });
}

export async function updateProjectTemplate(
  id: string,
  data: ProjectTemplateInput,
): Promise<void> {
  return http<void>(`/api/project-templates/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteProjectTemplate(id: string): Promise<void> {
  return http<void>(`/api/project-templates/${id}`, { method: "DELETE" });
}
