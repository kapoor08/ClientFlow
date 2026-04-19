import { z } from "zod";

export type ProjectTemplateTask = {
  title: string;
  description?: string;
  priority?: string;
  dueDaysFromStart?: number;
};

const templateTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required.").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDaysFromStart: z.coerce.number().int().min(0).max(365).optional(),
});

export const createProjectTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required.").max(120),
  description: z.string().max(2000).optional(),
  defaultStatus: z
    .enum(["draft", "active", "on_hold", "completed", "canceled"])
    .optional(),
  defaultPriority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  tasks: z.array(templateTaskSchema).max(100).optional(),
});
export type CreateProjectTemplateInput = z.infer<typeof createProjectTemplateSchema>;

export const updateProjectTemplateSchema = createProjectTemplateSchema.partial();
export type UpdateProjectTemplateInput = z.infer<typeof updateProjectTemplateSchema>;
