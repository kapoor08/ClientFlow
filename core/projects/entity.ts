import type { ProjectFormValues, ProjectStatus, ProjectPriority } from "@/schemas/projects";
import { PROJECT_STATUS_LABELS } from "@/constants/project";

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

// ─── Display constants ────────────────────────────────────────────────────────

export { PROJECT_STATUS_LABELS };

export const PROJECT_STATUS_STYLES: Record<string, string> = {
  planning: "bg-secondary text-muted-foreground",
  in_progress: "bg-info/10 text-info",
  on_hold: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

export const PROJECT_PRIORITY_STYLES: Record<string, string> = {
  low: "bg-neutral-300/50 text-neutral-500",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-danger/10 text-danger",
};
