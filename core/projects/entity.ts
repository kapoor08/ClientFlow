import type { ProjectFormValues, ProjectStatus, ProjectPriority } from "@/lib/projects-shared";

export type ProjectListItem = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  status: ProjectStatus;
  priority: ProjectPriority | null;
  startDate: string | null; // ISO string from JSON
  dueDate: string | null;   // ISO string from JSON
  taskCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectListResponse = {
  projects: ProjectListItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type ProjectMutationResponse = {
  projectId: string;
};

export type ListProjectsParams = {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: string;
  clientId?: string;
};

export type CreateProjectData = ProjectFormValues;
export type UpdateProjectData = ProjectFormValues;
