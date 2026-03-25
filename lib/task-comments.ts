import "server-only";

import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { tasks, taskComments, taskAuditLogs } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { dispatchNotification } from "@/lib/notifications";

export type TaskComment = {
  id: string;
  body: string;
  authorUserId: string;
  authorName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskActivityEntry = {
  id: string;
  action: string;
  actorUserId: string | null;
  actorName: string | null;
  newValues: Record<string, unknown> | null;
  oldValues: Record<string, unknown> | null;
  createdAt: Date;
};

async function verifyTaskAccess(
  userId: string,
  taskId: string,
): Promise<{ organizationId: string; assigneeUserId: string | null; title: string } | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const [task] = await db
    .select({ id: tasks.id, assigneeUserId: tasks.assigneeUserId, title: tasks.title })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.organizationId, context.organizationId),
        isNull(tasks.deletedAt),
      ),
    )
    .limit(1);

  if (!task) return null;
  return {
    organizationId: context.organizationId,
    assigneeUserId: task.assigneeUserId,
    title: task.title,
  };
}

export async function listTaskComments(
  userId: string,
  taskId: string,
): Promise<TaskComment[] | null> {
  const access = await verifyTaskAccess(userId, taskId);
  if (!access) return null;

  const rows = await db
    .select({
      id: taskComments.id,
      body: taskComments.body,
      authorUserId: taskComments.authorUserId,
      authorName: user.name,
      createdAt: taskComments.createdAt,
      updatedAt: taskComments.updatedAt,
    })
    .from(taskComments)
    .leftJoin(user, eq(taskComments.authorUserId, user.id))
    .where(
      and(eq(taskComments.taskId, taskId), isNull(taskComments.deletedAt)),
    )
    .orderBy(asc(taskComments.createdAt));

  return rows.map((r) => ({ ...r, authorName: r.authorName ?? null }));
}

export async function createTaskComment(
  userId: string,
  taskId: string,
  body: string,
): Promise<{ commentId: string }> {
  const access = await verifyTaskAccess(userId, taskId);
  if (!access) throw new Error("Task not found.");

  const commentId = crypto.randomUUID();

  await db.insert(taskComments).values({
    id: commentId,
    organizationId: access.organizationId,
    taskId,
    authorUserId: userId,
    body,
  });

  db.insert(taskAuditLogs)
    .values({
      id: crypto.randomUUID(),
      organizationId: access.organizationId,
      taskId,
      actorUserId: userId,
      action: "comment.added",
      newValues: { commentId },
    })
    .catch(console.error);

  // Notify task assignee about the new comment (if different from commenter)
  if (access.assigneeUserId && access.assigneeUserId !== userId) {
    dispatchNotification({
      organizationId: access.organizationId,
      recipientUserIds: [access.assigneeUserId],
      eventKey: "task_comment_added",
      title: "New comment on your task",
      body: access.title,
      url: "/tasks",
    }).catch(console.error);
  }

  return { commentId };
}

export async function listTaskActivity(
  userId: string,
  taskId: string,
): Promise<TaskActivityEntry[] | null> {
  const access = await verifyTaskAccess(userId, taskId);
  if (!access) return null;

  const rows = await db
    .select({
      id: taskAuditLogs.id,
      action: taskAuditLogs.action,
      actorUserId: taskAuditLogs.actorUserId,
      actorName: user.name,
      newValues: taskAuditLogs.newValues,
      oldValues: taskAuditLogs.oldValues,
      createdAt: taskAuditLogs.createdAt,
    })
    .from(taskAuditLogs)
    .leftJoin(user, eq(taskAuditLogs.actorUserId, user.id))
    .where(eq(taskAuditLogs.taskId, taskId))
    .orderBy(desc(taskAuditLogs.createdAt));

  return rows.map((r) => ({
    ...r,
    actorName: r.actorName ?? null,
    newValues: r.newValues as Record<string, unknown> | null,
    oldValues: r.oldValues as Record<string, unknown> | null,
  }));
}
