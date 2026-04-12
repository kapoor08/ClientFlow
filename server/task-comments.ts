import "server-only";

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { tasks, taskComments, taskAuditLogs, projects } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { db } from "@/server/db/client";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { dispatchNotification } from "@/server/notifications/data";
import { onTaskCommentAdded, onTaskMentioned } from "@/server/email/triggers";
import { enforceCommentLimit } from "@/server/subscription/plan-enforcement";

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
): Promise<{ organizationId: string; assigneeUserId: string | null; title: string; projectId: string | null; refNumber: string | null } | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const [task] = await db
    .select({ id: tasks.id, assigneeUserId: tasks.assigneeUserId, title: tasks.title, projectId: tasks.projectId, refNumber: tasks.refNumber })
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
    projectId: task.projectId ?? null,
    refNumber: task.refNumber ?? null,
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

  await enforceCommentLimit(access.organizationId);

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
      url: `/tasks?task=${access.refNumber ?? taskId}`,
    }).catch(console.error);
  }

  // ─── Email triggers ────────────────────────────────────────────────────────
  const commentSnippet = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);

  // Extract mentioned user IDs from Tiptap mention nodes: data-id="<userId>"
  const mentionedIds = Array.from(body.matchAll(/data-id="([^"]+)"/g)).map((m) => m[1]);

  const actorId = userId;
  Promise.all([
    db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, actorId)).limit(1),
    access.assigneeUserId
      ? db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, access.assigneeUserId)).limit(1)
      : Promise.resolve([null] as const),
    access.projectId
      ? db.select({ name: projects.name }).from(projects).where(eq(projects.id, access.projectId)).limit(1)
      : Promise.resolve([null] as const),
    mentionedIds.length > 0
      ? db.select({ id: user.id, name: user.name, email: user.email }).from(user).where(inArray(user.id, mentionedIds))
      : Promise.resolve([] as { id: string; name: string | null; email: string }[]),
  ]).then(([actorRows, assigneeRows, projectRows, mentionedUsers]) => {
    const actor = actorRows[0];
    if (!actor?.email) return;

    const taskRef = { id: taskId, title: access.title, dueDate: null };
    const projectRef = { id: access.projectId ?? "", name: projectRows?.[0]?.name ?? "Unknown project" };
    const actorRef = { id: actorId, name: actor.name ?? "A teammate", email: actor.email };

    const promises: Promise<unknown>[] = [];

    // Comment notification to assignee
    if (access.assigneeUserId && access.assigneeUserId !== userId) {
      const assignee = assigneeRows[0];
      if (assignee?.email) {
        promises.push(onTaskCommentAdded({
          recipients: [{ id: access.assigneeUserId, name: assignee.name ?? "Team member", email: assignee.email }],
          task: taskRef,
          project: projectRef,
          actor: actorRef,
          commentSnippet,
        }));
      }
    }

    // Mention notifications (excluding the comment author)
    for (const mentioned of mentionedUsers) {
      if (mentioned.id !== userId && mentioned.email) {
        promises.push(onTaskMentioned({
          mentioned: { id: mentioned.id, name: mentioned.name ?? "Team member", email: mentioned.email },
          task: taskRef,
          project: projectRef,
          actor: actorRef,
          commentSnippet,
        }));
      }
    }

    return Promise.all(promises);
  }).catch(console.error);

  return { commentId };
}

export async function updateTaskComment(
  userId: string,
  taskId: string,
  commentId: string,
  body: string,
): Promise<void> {
  const access = await verifyTaskAccess(userId, taskId);
  if (!access) throw new Error("Task not found.");

  const [comment] = await db
    .select({ authorUserId: taskComments.authorUserId })
    .from(taskComments)
    .where(and(eq(taskComments.id, commentId), eq(taskComments.taskId, taskId), isNull(taskComments.deletedAt)))
    .limit(1);

  if (!comment) throw new Error("Comment not found.");
  if (comment.authorUserId !== userId) throw new Error("Not authorized.");

  await db
    .update(taskComments)
    .set({ body, updatedAt: new Date() })
    .where(eq(taskComments.id, commentId));

  db.insert(taskAuditLogs)
    .values({
      id: crypto.randomUUID(),
      organizationId: access.organizationId,
      taskId,
      actorUserId: userId,
      action: "comment.updated",
      newValues: { commentId },
    })
    .catch(console.error);
}

export async function deleteTaskComment(
  userId: string,
  taskId: string,
  commentId: string,
): Promise<void> {
  const access = await verifyTaskAccess(userId, taskId);
  if (!access) throw new Error("Task not found.");

  const [comment] = await db
    .select({ authorUserId: taskComments.authorUserId })
    .from(taskComments)
    .where(and(eq(taskComments.id, commentId), eq(taskComments.taskId, taskId), isNull(taskComments.deletedAt)))
    .limit(1);

  if (!comment) throw new Error("Comment not found.");
  if (comment.authorUserId !== userId) throw new Error("Not authorized.");

  await db
    .update(taskComments)
    .set({ deletedAt: new Date() })
    .where(eq(taskComments.id, commentId));

  db.insert(taskAuditLogs)
    .values({
      id: crypto.randomUUID(),
      organizationId: access.organizationId,
      taskId,
      actorUserId: userId,
      action: "comment.deleted",
      oldValues: { commentId },
    })
    .catch(console.error);
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
