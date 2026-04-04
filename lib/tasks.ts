import "server-only";

import { and, asc, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { tasks, projects, taskAuditLogs, taskBoardColumns } from "@/db/schema";
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
import { enforceTaskCreationLimit } from "@/lib/plan-enforcement";
import { dispatchNotification } from "@/lib/notifications";
import { onTaskAssigned, onTaskStatusChanged } from "@/lib/email-triggers";
import type { TaskFormValues } from "@/lib/tasks-shared";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatch";

export type TaskListItem = {
  id: string;
  title: string;
  projectId: string;
  projectName: string | null;
  status: string;
  priority: string | null;
  assigneeUserId: string | null;
  assigneeName: string | null;
  assignees: { userId: string; name: string | null }[];
  dueDate: Date | null;
  estimateMinutes: number | null;
  estimateSetAt: Date | null;
  commentCount: number;
  attachmentCount: number;
  createdAt: Date;
  columnId: string | null;
  refNumber: string | null;
  tags: string[];
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
    isNull(tasks.parentTaskId),
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
        estimateSetAt: tasks.estimateSetAt,
        commentCount:
          sql<number>`(SELECT COUNT(*) FROM task_comments WHERE task_id = ${tasks.id} AND deleted_at IS NULL)`,
        attachmentCount:
          sql<number>`(SELECT COUNT(*) FROM task_attachments WHERE task_id = ${tasks.id})`,
        assignees: sql<{ userId: string; name: string | null }[]>`(
          SELECT COALESCE(
            json_agg(json_build_object('userId', ta.user_id, 'name', u.name) ORDER BY ta.created_at),
            '[]'::json
          )
          FROM task_assignees ta
          JOIN "user" u ON u.id = ta.user_id
          WHERE ta.task_id = ${tasks.id}
        )`,
        createdAt: tasks.createdAt,
        columnId: tasks.columnId,
        refNumber: tasks.refNumber,
        tags: tasks.tags,
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

  await enforceTaskCreationLimit(context.organizationId);

  const taskId = crypto.randomUUID();
  const title = input.title.trim();
  const refNumber = `CF-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  await db.insert(tasks).values({
    id: taskId,
    organizationId: context.organizationId,
    projectId: input.projectId,
    parentTaskId: input.parentTaskId ?? null,
    title,
    description: input.description?.trim() || null,
    status: input.status,
    priority: input.priority,
    assigneeUserId: input.assigneeUserId,
    dueDate: input.dueDate,
    estimateMinutes: input.estimateMinutes,
    reporterUserId: userId,
    columnId: input.columnId ?? null,
    refNumber,
    tags: input.tags ?? [],
  });

  // ─── Audit log (global) ────────────────────────────────────────────────────
  writeAuditLog({
    organizationId: context.organizationId,
    actorUserId: userId,
    action: "task.created",
    entityType: "task",
    entityId: taskId,
    metadata: { name: title },
  }).catch(console.error);

  // ─── Task activity log ─────────────────────────────────────────────────────
  db.insert(taskAuditLogs).values({
    id: crypto.randomUUID(),
    organizationId: context.organizationId,
    taskId,
    actorUserId: userId,
    action: "task.created",
    newValues: { title },
  }).catch(console.error);

  // ─── Webhook dispatch ─────────────────────────────────────────────────────
  dispatchWebhookEvent(context.organizationId, "task.created", {
    taskId,
    title,
    status: input.status,
    priority: input.priority,
    projectId: input.projectId ?? null,
  }).catch(console.error);

  // ─── Notify assignee ───────────────────────────────────────────────────────
  if (input.assigneeUserId && input.assigneeUserId !== userId) {
    dispatchNotification({
      organizationId: context.organizationId,
      recipientUserIds: [input.assigneeUserId],
      eventKey: "task_assigned",
      title: "Task assigned to you",
      body: title,
      url: `/tasks?task=${refNumber}`,
    }).catch(console.error);

    // Email trigger
    Promise.all([
      db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, input.assigneeUserId)).limit(1),
      db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1),
      input.projectId
        ? db.select({ name: projects.name }).from(projects).where(eq(projects.id, input.projectId)).limit(1)
        : Promise.resolve([null] as const),
    ]).then(([assigneeRows, actorRows, projectRows]) => {
      const assignee = assigneeRows[0];
      const actor = actorRows[0];
      if (!assignee?.email || !actor?.email) return;
      return onTaskAssigned({
        assignee: { id: input.assigneeUserId!, name: assignee.name ?? "Team member", email: assignee.email },
        task: { id: taskId, title, dueDate: input.dueDate },
        project: { id: input.projectId, name: projectRows?.[0]?.name ?? "Unknown project" },
        actor: { id: userId, name: actor.name ?? "A teammate", email: actor.email },
      });
    }).catch(console.error);
  }

  return { taskId };
}

export async function updateTaskForUser(
  userId: string,
  taskId: string,
  input: TaskFormValues,
): Promise<{ taskId: string }> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  // ─── Fetch existing values for diff ───────────────────────────────────────
  const assigneeUser = alias(user, "old_assignee");

  const [existing] = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      assigneeUserId: tasks.assigneeUserId,
      assigneeName: assigneeUser.name,
      dueDate: tasks.dueDate,
      columnId: tasks.columnId,
      columnName: taskBoardColumns.name,
      estimateMinutes: tasks.estimateMinutes,
      description: tasks.description,
      tags: tasks.tags,
      refNumber: tasks.refNumber,
    })
    .from(tasks)
    .leftJoin(assigneeUser, eq(tasks.assigneeUserId, assigneeUser.id))
    .leftJoin(taskBoardColumns, eq(tasks.columnId, taskBoardColumns.id))
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.organizationId, context.organizationId),
        isNull(tasks.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) throw new Error("Task not found.");

  // ─── Perform update ────────────────────────────────────────────────────────
  const estimateChanged = (existing.estimateMinutes ?? null) !== (input.estimateMinutes ?? null);

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
      estimateSetAt: estimateChanged
        ? (input.estimateMinutes ? new Date() : null)
        : undefined,
      columnId: input.columnId ?? null,
      reporterUserId: input.reporterUserId ?? null,
      tags: input.tags ?? [],
      completedAt: input.status === "done" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  // ─── Build diff ────────────────────────────────────────────────────────────

  function entry(action: string, oldVal: unknown, newVal: unknown) {
    return {
      id: crypto.randomUUID(),
      organizationId: context!.organizationId,
      taskId,
      actorUserId: userId,
      action,
      oldValues: oldVal as Record<string, unknown>,
      newValues: newVal as Record<string, unknown>,
    };
  }

  const entries: {
    id: string;
    organizationId: string;
    taskId: string;
    actorUserId: string;
    action: string;
    oldValues: Record<string, unknown> | null;
    newValues: Record<string, unknown> | null;
  }[] = [];

  // Title
  if (existing.title !== input.title.trim()) {
    entries.push(entry("title.changed", { label: existing.title }, { label: input.title.trim() }));
  }

  // Priority
  if (existing.priority !== input.priority) {
    entries.push(entry(
      "priority.changed",
      { label: existing.priority ?? "None" },
      { label: input.priority ?? "None" },
    ));
  }

  // Status
  if (existing.status !== input.status) {
    entries.push(entry(
      "status.changed",
      { label: formatStatusLabel(existing.status) },
      { label: formatStatusLabel(input.status) },
    ));
  }

  // Assignee
  const assigneeChanged = existing.assigneeUserId !== input.assigneeUserId;
  let newAssigneeName: string | null = null;
  if (assigneeChanged) {
    if (input.assigneeUserId) {
      const [newUser] = await db
        .select({ name: user.name })
        .from(user)
        .where(eq(user.id, input.assigneeUserId))
        .limit(1);
      newAssigneeName = newUser?.name ?? null;
    }
    entries.push(entry(
      "assignee.changed",
      { userId: existing.assigneeUserId, name: existing.assigneeName },
      { userId: input.assigneeUserId, name: newAssigneeName },
    ));
  }

  // Column
  if (existing.columnId !== (input.columnId ?? null)) {
    let newColumnName: string | null = null;
    if (input.columnId) {
      const [col] = await db
        .select({ name: taskBoardColumns.name })
        .from(taskBoardColumns)
        .where(eq(taskBoardColumns.id, input.columnId))
        .limit(1);
      newColumnName = col?.name ?? null;
    }
    entries.push(entry(
      "column.moved",
      { columnId: existing.columnId, name: existing.columnName },
      { columnId: input.columnId ?? null, name: newColumnName },
    ));
  }

  // Due date
  const oldDue = existing.dueDate?.toISOString().slice(0, 10) ?? null;
  const newDue = input.dueDate instanceof Date
    ? input.dueDate.toISOString().slice(0, 10)
    : (input.dueDate ? new Date(input.dueDate as unknown as string).toISOString().slice(0, 10) : null);
  if (oldDue !== newDue) {
    entries.push(entry(
      "dueDate.changed",
      { label: oldDue ? formatDateShort(oldDue) : "None" },
      { label: newDue ? formatDateShort(newDue) : "None" },
    ));
  }

  // Estimate
  if ((existing.estimateMinutes ?? null) !== (input.estimateMinutes ?? null)) {
    entries.push(entry(
      "estimate.changed",
      { minutes: existing.estimateMinutes ?? null },
      { minutes: input.estimateMinutes ?? null },
    ));
  }

  // Description
  const oldDesc = existing.description?.trim() || null;
  const newDesc = input.description?.trim() || null;
  if (oldDesc !== newDesc) {
    entries.push(entry(
      "description.changed",
      { hadContent: !!oldDesc },
      { hadContent: !!newDesc },
    ));
  }

  // Tags
  const oldTags = [...(existing.tags ?? [])].sort();
  const newTags = [...(input.tags ?? [])].sort();
  if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
    const added = newTags.filter((t) => !oldTags.includes(t));
    const removed = oldTags.filter((t) => !newTags.includes(t));
    entries.push(entry(
      "tags.changed",
      { tags: oldTags, removed },
      { tags: newTags, added },
    ));
  }

  // ─── Write activity log entries ────────────────────────────────────────────
  if (entries.length > 0) {
    db.insert(taskAuditLogs).values(entries).catch(console.error);
  }

  // ─── Notifications ─────────────────────────────────────────────────────────
  const taskTitle = input.title.trim();

  // Notify new assignee
  if (assigneeChanged && input.assigneeUserId && input.assigneeUserId !== userId) {
    dispatchNotification({
      organizationId: context.organizationId,
      recipientUserIds: [input.assigneeUserId],
      eventKey: "task_assigned",
      title: "Task assigned to you",
      body: taskTitle,
      url: `/tasks?task=${existing.refNumber ?? taskId}`,
    }).catch(console.error);
  }

  // Notify assignee of status change
  const assigneeToNotify = input.assigneeUserId ?? existing.assigneeUserId;
  if (
    existing.status !== input.status &&
    assigneeToNotify &&
    assigneeToNotify !== userId
  ) {
    dispatchNotification({
      organizationId: context.organizationId,
      recipientUserIds: [assigneeToNotify],
      eventKey: "task_status_changed",
      title: `Task status changed: ${formatStatusLabel(input.status)}`,
      body: taskTitle,
      url: `/tasks?task=${existing.refNumber ?? taskId}`,
    }).catch(console.error);
  }

  // ─── Email triggers ────────────────────────────────────────────────────────
  if (assigneeChanged && input.assigneeUserId && input.assigneeUserId !== userId) {
    Promise.all([
      db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, input.assigneeUserId)).limit(1),
      db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1),
      db.select({ name: projects.name }).from(projects).where(eq(projects.id, input.projectId)).limit(1),
    ]).then(([assigneeRows, actorRows, projectRows]) => {
      const assignee = assigneeRows[0];
      const actor = actorRows[0];
      if (!assignee?.email || !actor?.email) return;
      return onTaskAssigned({
        assignee: { id: input.assigneeUserId!, name: assignee.name ?? "Team member", email: assignee.email },
        task: { id: taskId, title: taskTitle, dueDate: input.dueDate },
        project: { id: input.projectId, name: projectRows?.[0]?.name ?? "Unknown project" },
        actor: { id: userId, name: actor.name ?? "A teammate", email: actor.email },
      });
    }).catch(console.error);
  }

  if (existing.status !== input.status && assigneeToNotify && assigneeToNotify !== userId) {
    Promise.all([
      db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, assigneeToNotify)).limit(1),
      db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1),
      db.select({ name: projects.name }).from(projects).where(eq(projects.id, input.projectId)).limit(1),
    ]).then(([recipientRows, actorRows, projectRows]) => {
      const recipient = recipientRows[0];
      const actor = actorRows[0];
      if (!recipient?.email || !actor?.email) return;
      return onTaskStatusChanged({
        recipients: [{ id: assigneeToNotify!, name: recipient.name ?? "Team member", email: recipient.email }],
        task: { id: taskId, title: taskTitle, dueDate: input.dueDate },
        project: { id: input.projectId, name: projectRows?.[0]?.name ?? "Unknown project" },
        actor: { id: userId, name: actor.name ?? "A teammate", email: actor.email },
        fromStatus: formatStatusLabel(existing.status),
        toStatus: formatStatusLabel(input.status),
      });
    }).catch(console.error);
  }

  // ─── Global audit log ──────────────────────────────────────────────────────
  writeAuditLog({
    organizationId: context.organizationId,
    actorUserId: userId,
    action: "task.updated",
    entityType: "task",
    entityId: taskId,
    metadata: { name: taskTitle },
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

export async function moveTaskColumnForUser(
  userId: string,
  taskId: string,
  columnId: string | null,
): Promise<void> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  const [existing] = await db
    .select({
      id: tasks.id,
      columnId: tasks.columnId,
      columnName: taskBoardColumns.name,
    })
    .from(tasks)
    .leftJoin(taskBoardColumns, eq(tasks.columnId, taskBoardColumns.id))
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.organizationId, context.organizationId),
        isNull(tasks.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) throw new Error("Task not found.");

  // Resolve the target column's type to derive the new status
  const COLUMN_TYPE_TO_STATUS: Record<string, string> = {
    todo: "todo",
    in_progress: "in_progress",
    testing_qa: "review",
    completed: "done",
  };

  let newStatus: string | null = null;
  let newColumnName: string | null = null;

  if (columnId) {
    const [targetCol] = await db
      .select({ name: taskBoardColumns.name, columnType: taskBoardColumns.columnType })
      .from(taskBoardColumns)
      .where(eq(taskBoardColumns.id, columnId))
      .limit(1);

    if (targetCol) {
      newColumnName = targetCol.name;
      newStatus = targetCol.columnType ? (COLUMN_TYPE_TO_STATUS[targetCol.columnType] ?? null) : null;
    }
  }

  await db
    .update(tasks)
    .set({
      columnId,
      ...(newStatus ? { status: newStatus, completedAt: newStatus === "done" ? new Date() : null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  // Log the column move in task audit log
  if (existing.columnId !== columnId) {

    db.insert(taskAuditLogs)
      .values({
        id: crypto.randomUUID(),
        organizationId: context.organizationId,
        taskId,
        actorUserId: userId,
        action: "column.moved",
        oldValues: { columnId: existing.columnId, name: existing.columnName },
        newValues: { columnId, name: newColumnName },
      })
      .catch(console.error);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    review: "Review",
    blocked: "Blocked",
    done: "Done",
  };
  return labels[status] ?? status;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
