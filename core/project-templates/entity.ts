import type { ProjectTemplateTask } from "@/server/project-templates";

export type { ProjectTemplateTask };

export type ProjectTemplate = {
  id: string;
  name: string;
  description: string | null;
  defaultStatus: string;
  defaultPriority: string | null;
  tasks: ProjectTemplateTask[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectTemplateListResponse = {
  templates: ProjectTemplate[];
};

export type ProjectTemplateInput = {
  name: string;
  description: string | null;
  defaultStatus: string;
  defaultPriority: string | null;
  tasks: ProjectTemplateTask[];
};
