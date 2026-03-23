import "server-only";

import { and, asc, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { tasks, projects } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import {
  DEFAULT_PAGE_SIZE,
  buildPaginationMeta,
  paginationOffset,
  type PaginationMeta,
} from "@/lib/pagination";
import { writeAuditLog } from "@/lib/audit";
import type { TaskFormValues } from "@/lib/tasks-shared";

export type TaskListItem = {
  id: string;
  title: string;
  projectId: string;
  projectName: string | null;
  status: string;
  priority: string | null;
  assigneeUserId: string | null;
  assigneeName: string | null;
  dueDate: Date | null;
  estimateMinutes: number | null;
  commentCount: number;
  attachmentCount: number;
  createdAt: Date;
};

type ListTasksOptions = {
  q?: string;
  status?: string;
  priority?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
};

export async function listTasksForUser(
  userId: string,
  options: ListTasksOptions = {},
): Promise<{
  tasks: TaskListItem[];
  pagination: PaginationMeta;
} | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const {
    q = "",
    status,
    priority,
    projectId,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    order = "desc",
  } = options;

  const trimmed = q.trim();

  const whereClause = and(
    eq(tasks.organizationId, context.organizationId),
    isNull(tasks.deletedAt),
    trimmed
      ? or(
          ilike(tasks.title, `%${trimmed}%`),
          ilike(projects.name, `%${trimmed}%`),
        )
      : undefined,
    status ? eq(tasks.status, status) : undefined,
    priority ? eq(tasks.priority, priority) : undefined,
    projectId ? eq(tasks.projectId, projectId) : undefined,
  );

  const orderBy =
    order === "asc" ? asc(tasks.createdAt) : desc(tasks.createdAt);

  const [totalResult, rows] = await Promise.all([
    db
      .select({ total: count(tasks.id) })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(whereClause),

    db
      .select({
        id: tasks.id,
        title: tasks.title,
        projectId: tasks.projectId,
        projectName: projects.name,
        status: tasks.status,
        priority: tasks.priority,
        assigneeUserId: tasks.assigneeUserId,
        assigneeName: user.name,
        dueDate: tasks.dueDate,
        estimateMinutes: tasks.estimateMinutes,
        commentCount:
          sql<number>`(SELECT COUNT(*) FROM task_comments WHERE task_id = ${tasks.id} AND deleted_at IS NULL)`,
        attachmentCount:
          sql<number>`(SELECT COUNT(*) FROM task_attachments WHERE task_id = ${tasks.id})`,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(user, eq(tasks.assigneeUserId, user.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(paginationOffset(page, pageSize)),
  ]);

  return {
    tasks: rows.map((r) => ({
      ...r,
      commentCount: Number(r.commentCount),
      attachmentCount: Number(r.attachmentCount),
    })),
    pagination: buildPaginationMeta(totalResult[0]?.total ?? 0, page, pageSize),
  };
}

export async function createTaskForUser(
  userId: string,
  input: TaskFormValues,
): Promise<{ taskId: string }> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  const taskId = crypto.randomUUID();

  await db.insert(tasks).values({
    id: taskId,
    organizationId: context.organizationId,
    projectId: input.projectId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status,
    priority: input.priority,
    assigneeUserId: input.assigneeUserId,
    dueDate: input.dueDate,
    estimateMinutes: input.estimateMinutes,
    reporterUserId: userId,
  });

  writeAuditLog({
    organizationId: context.organizationId,
    actorUserId: userId,
    action: "task.created",
    entityType: "task",
    entityId: taskId,
    metadata: { name: input.title.trim() },
  }).catch(console.error);

  return { taskId };
}

export async function updateTaskForUser(
  userId: string,
  taskId: string,
  input: TaskFormValues,
): Promise<{ taskId: string }> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  const [existing] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.organizationId, context.organizationId),
        isNull(tasks.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) throw new Error("Task not found.");

  await db
    .update(tasks)
    .set({
      projectId: input.projectId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status,
      priority: input.priority,
      assigneeUserId: input.assigneeUserId,
      dueDate: input.dueDate,
      estimateMinutes: input.estimateMinutes,
      completedAt:
        input.status === "done" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  writeAuditLog({
    organizationId: context.organizationId,
    actorUserId: userId,
    action: "task.updated",
    entityType: "task",
    entityId: taskId,
    metadata: { name: input.title.trim() },
  }).catch(console.error);

  return { taskId };
}

export async function deleteTaskForUser(
  userId: string,
  taskId: string,
): Promise<void> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  const [existing] = await db
    .select({ id: tasks.id, title: tasks.title })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.organizationId, context.organizationId),
        isNull(tasks.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) throw new Error("Task not found.");

  await db
    .update(tasks)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  writeAuditLog({
    organizationId: context.organizationId,
    actorUserId: userId,
    action: "task.deleted",
    entityType: "task",
    entityId: taskId,
    metadata: { name: existing.title },
  }).catch(console.error);
}
