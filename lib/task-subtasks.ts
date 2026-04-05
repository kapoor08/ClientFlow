import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { tasks, taskAuditLogs } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";

export type SubtaskItem = {
  id: string;
  title: string;
  status: string;
  assigneeUserId: string | null;
  assigneeName: string | null;
  createdAt: Date;
  tags: string[];
};

async function verifyTaskAccess(
  userId: string,
  taskId: string,
): Promise<{ organizationId: string; projectId: string } | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const [task] = await db
    .select({ id: tasks.id, projectId: tasks.projectId })
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
  return { organizationId: context.organizationId, projectId: task.projectId };
}

export async function listSubtasksForTask(
  userId: string,
  parentTaskId: string,
): Promise<SubtaskItem[] | null> {
  const access = await verifyTaskAccess(userId, parentTaskId);
  if (!access) return null;

  const assigneeUser = alias(user, "subtask_assignee");

  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      assigneeUserId: tasks.assigneeUserId,
      assigneeName: assigneeUser.name,
      createdAt: tasks.createdAt,
      tags: tasks.tags,
    })
    .from(tasks)
    .leftJoin(assigneeUser, eq(tasks.assigneeUserId, assigneeUser.id))
    .where(
      and(
        eq(tasks.parentTaskId, parentTaskId),
        eq(tasks.organizationId, access.organizationId),
        isNull(tasks.deletedAt),
      ),
    )
    .orderBy(asc(tasks.createdAt));

  return rows.map((r) => ({ ...r, assigneeName: r.assigneeName ?? null }));
}

export async function createSubtaskForUser(
  userId: string,
  parentTaskId: string,
  title: string,
): Promise<{ taskId: string }> {
  const access = await verifyTaskAccess(userId, parentTaskId);
  if (!access) throw new Error("Parent task not found.");

  const taskId = crypto.randomUUID();

  const trimmedTitle = title.trim();

  await db.insert(tasks).values({
    id: taskId,
    organizationId: access.organizationId,
    projectId: access.projectId,
    parentTaskId,
    title: trimmedTitle,
    status: "todo",
    reporterUserId: userId,
  });

  db.insert(taskAuditLogs)
    .values({
      id: crypto.randomUUID(),
      organizationId: access.organizationId,
      taskId: parentTaskId,
      actorUserId: userId,
      action: "subtask.added",
      newValues: { title: trimmedTitle },
    })
    .catch(console.error);

  return { taskId };
}

export async function toggleSubtaskStatusForUser(
  userId: string,
  subtaskId: string,
): Promise<void> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  const [subtask] = await db
    .select({ id: tasks.id, status: tasks.status, title: tasks.title, parentTaskId: tasks.parentTaskId })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, subtaskId),
        eq(tasks.organizationId, context.organizationId),
        isNull(tasks.deletedAt),
      ),
    )
    .limit(1);

  if (!subtask) throw new Error("Subtask not found.");

  const newStatus = subtask.status === "done" ? "todo" : "done";

  await db
    .update(tasks)
    .set({
      status: newStatus,
      completedAt: newStatus === "done" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, subtaskId));

  if (subtask.parentTaskId) {
    db.insert(taskAuditLogs)
      .values({
        id: crypto.randomUUID(),
        organizationId: context.organizationId,
        taskId: subtask.parentTaskId,
        actorUserId: userId,
        action: newStatus === "done" ? "subtask.completed" : "subtask.reopened",
        newValues: { title: subtask.title },
      })
      .catch(console.error);
  }
}

export async function deleteSubtaskForUser(
  userId: string,
  subtaskId: string,
): Promise<void> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  const [subtask] = await db
    .select({ title: tasks.title, parentTaskId: tasks.parentTaskId })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, subtaskId),
        eq(tasks.organizationId, context.organizationId),
        isNull(tasks.deletedAt),
      ),
    )
    .limit(1);

  await db
    .update(tasks)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(tasks.id, subtaskId),
        eq(tasks.organizationId, context.organizationId),
        isNull(tasks.deletedAt),
      ),
    );

  if (subtask?.parentTaskId) {
    db.insert(taskAuditLogs)
      .values({
        id: crypto.randomUUID(),
        organizationId: context.organizationId,
        taskId: subtask.parentTaskId,
        actorUserId: userId,
        action: "subtask.deleted",
        oldValues: { title: subtask.title },
      })
      .catch(console.error);
  }
}
