import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { projectTemplates, type ProjectTemplateTask } from "@/db/schema";
import { db } from "@/server/db/client";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";

export type { ProjectTemplateTask };

export type ProjectTemplateItem = {
  id: string;
  name: string;
  description: string | null;
  defaultStatus: string;
  defaultPriority: string | null;
  tasks: ProjectTemplateTask[];
  createdAt: Date;
  updatedAt: Date;
};

export async function listProjectTemplatesForUser(
  userId: string,
): Promise<ProjectTemplateItem[] | null> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) return null;

  return db
    .select({
      id: projectTemplates.id,
      name: projectTemplates.name,
      description: projectTemplates.description,
      defaultStatus: projectTemplates.defaultStatus,
      defaultPriority: projectTemplates.defaultPriority,
      tasks: projectTemplates.tasks,
      createdAt: projectTemplates.createdAt,
      updatedAt: projectTemplates.updatedAt,
    })
    .from(projectTemplates)
    .where(eq(projectTemplates.organizationId, ctx.organizationId))
    .orderBy(desc(projectTemplates.createdAt));
}

export async function createProjectTemplateForUser(
  userId: string,
  data: {
    name: string;
    description?: string;
    defaultStatus?: string;
    defaultPriority?: string;
    tasks?: ProjectTemplateTask[];
  },
): Promise<ProjectTemplateItem> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings && ctx.roleKey !== "manager")
    throw new Error("You don't have permission to create templates.");

  const id = crypto.randomUUID();

  const [row] = await db
    .insert(projectTemplates)
    .values({
      id,
      organizationId: ctx.organizationId,
      name: data.name.trim(),
      description: data.description?.trim() ?? null,
      defaultStatus: data.defaultStatus ?? "planning",
      defaultPriority: data.defaultPriority ?? null,
      tasks: data.tasks ?? [],
      createdByUserId: userId,
    })
    .returning();

  return { ...row, tasks: (row.tasks as ProjectTemplateTask[]) ?? [] };
}

export async function updateProjectTemplateForUser(
  userId: string,
  templateId: string,
  data: Partial<{
    name: string;
    description: string | null;
    defaultStatus: string;
    defaultPriority: string | null;
    tasks: ProjectTemplateTask[];
  }>,
): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings && ctx.roleKey !== "manager")
    throw new Error("You don't have permission to update templates.");

  const [existing] = await db
    .select({ id: projectTemplates.id })
    .from(projectTemplates)
    .where(and(eq(projectTemplates.id, templateId), eq(projectTemplates.organizationId, ctx.organizationId)))
    .limit(1);

  if (!existing) throw new Error("Template not found.");

  await db
    .update(projectTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projectTemplates.id, templateId));
}

export async function deleteProjectTemplateForUser(
  userId: string,
  templateId: string,
): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings && ctx.roleKey !== "manager")
    throw new Error("You don't have permission to delete templates.");

  const [existing] = await db
    .select({ id: projectTemplates.id })
    .from(projectTemplates)
    .where(and(eq(projectTemplates.id, templateId), eq(projectTemplates.organizationId, ctx.organizationId)))
    .limit(1);

  if (!existing) throw new Error("Template not found.");

  await db.delete(projectTemplates).where(eq(projectTemplates.id, templateId));
}
