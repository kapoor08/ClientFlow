import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { timeEntries, projects, tasks, taskAuditLogs } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { writeAuditLog } from "@/server/security/audit";

export type TimeEntryItem = {
  id: string;
  projectId: string;
  taskId: string | null;
  taskTitle: string | null;
  userId: string;
  userName: string;
  minutes: number;
  description: string | null;
  loggedAt: Date;
  createdAt: Date;
};

export type LogTimeInput = {
  projectId: string;
  taskId?: string | null;
  minutes: number;
  description?: string;
  loggedAt?: string; // ISO date string, defaults to now
};

export type ProjectTimeSummary = {
  totalMinutes: number;
  entryCount: number;
};

export async function logTimeForUser(
  userId: string,
  input: LogTimeInput,
): Promise<{ entryId: string }> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");

  if (!input.projectId) throw new Error("projectId is required.");
  if (!input.minutes || input.minutes < 1) throw new Error("minutes must be at least 1.");

  // Verify project belongs to the org and get name
  const [project] = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(and(eq(projects.id, input.projectId), eq(projects.organizationId, ctx.organizationId)))
    .limit(1);

  if (!project) throw new Error("Project not found.");

  // Fetch task title if provided
  let taskTitle: string | null = null;
  if (input.taskId) {
    const [task] = await db
      .select({ title: tasks.title })
      .from(tasks)
      .where(eq(tasks.id, input.taskId))
      .limit(1);
    taskTitle = task?.title ?? null;
  }

  const id = crypto.randomUUID();

  await db.insert(timeEntries).values({
    id,
    organizationId: ctx.organizationId,
    projectId: input.projectId,
    taskId: input.taskId ?? null,
    userId,
    minutes: input.minutes,
    description: input.description?.trim() || null,
    loggedAt: input.loggedAt ? new Date(input.loggedAt) : new Date(),
  });

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: userId,
    action: "time_entry.created",
    entityType: "time_entry",
    entityId: id,
    metadata: {
      project: project.name,
      minutes: input.minutes,
      ...(taskTitle ? { task: taskTitle } : {}),
      ...(input.description ? { description: input.description.trim() } : {}),
    },
  }).catch(console.error);

  if (input.taskId) {
    db.insert(taskAuditLogs)
      .values({
        id: crypto.randomUUID(),
        organizationId: ctx.organizationId,
        taskId: input.taskId,
        actorUserId: userId,
        action: "time.logged",
        newValues: {
          minutes: input.minutes,
          description: input.description?.trim() || null,
        },
      })
      .catch(console.error);
  }

  return { entryId: id };
}

export async function listTimeEntriesForProject(
  userId: string,
  projectId: string,
): Promise<TimeEntryItem[] | null> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) return null;

  const rows = await db
    .select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      taskId: timeEntries.taskId,
      taskTitle: tasks.title,
      userId: timeEntries.userId,
      userName: user.name,
      minutes: timeEntries.minutes,
      description: timeEntries.description,
      loggedAt: timeEntries.loggedAt,
      createdAt: timeEntries.createdAt,
    })
    .from(timeEntries)
    .leftJoin(tasks, eq(timeEntries.taskId, tasks.id))
    .leftJoin(user, eq(timeEntries.userId, user.id))
    .where(
      and(eq(timeEntries.projectId, projectId), eq(timeEntries.organizationId, ctx.organizationId)),
    )
    .orderBy(desc(timeEntries.loggedAt));

  return rows.map((r) => ({
    ...r,
    userName: r.userName ?? "Unknown",
  }));
}

export async function listTimeEntriesForTask(
  userId: string,
  taskId: string,
): Promise<TimeEntryItem[] | null> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) return null;

  const rows = await db
    .select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      taskId: timeEntries.taskId,
      taskTitle: tasks.title,
      userId: timeEntries.userId,
      userName: user.name,
      minutes: timeEntries.minutes,
      description: timeEntries.description,
      loggedAt: timeEntries.loggedAt,
      createdAt: timeEntries.createdAt,
    })
    .from(timeEntries)
    .leftJoin(tasks, eq(timeEntries.taskId, tasks.id))
    .leftJoin(user, eq(timeEntries.userId, user.id))
    .where(and(eq(timeEntries.taskId, taskId), eq(timeEntries.organizationId, ctx.organizationId)))
    .orderBy(desc(timeEntries.loggedAt));

  return rows.map((r) => ({
    ...r,
    userName: r.userName ?? "Unknown",
  }));
}

export async function deleteTimeEntryForUser(userId: string, entryId: string): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");

  const [entry] = await db
    .select({ id: timeEntries.id, userId: timeEntries.userId })
    .from(timeEntries)
    .where(and(eq(timeEntries.id, entryId), eq(timeEntries.organizationId, ctx.organizationId)))
    .limit(1);

  if (!entry) throw new Error("Time entry not found.");

  // Only the entry owner or admin can delete
  if (entry.userId !== userId && !ctx.canManageSettings) {
    throw new Error("You can only delete your own time entries.");
  }

  await db.delete(timeEntries).where(eq(timeEntries.id, entryId));

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: userId,
    action: "time_entry.deleted",
    entityType: "time_entry",
    entityId: entryId,
  }).catch(console.error);
}

// ─── Org-wide listing + summary (used by /time-tracking) ────────────────────

export type OrgTimeEntryFilters = {
  projectId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
};

export type OrgTimeEntriesPage = {
  entries: TimeEntryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  totalMinutes: number;
};

export async function listTimeEntriesForOrg(
  userId: string,
  filters: OrgTimeEntryFilters = {},
): Promise<OrgTimeEntriesPage | null> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) return null;

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));

  const conditions = [eq(timeEntries.organizationId, ctx.organizationId)];
  if (filters.projectId) conditions.push(eq(timeEntries.projectId, filters.projectId));
  if (filters.userId) conditions.push(eq(timeEntries.userId, filters.userId));
  if (filters.dateFrom) {
    conditions.push(sql`${timeEntries.loggedAt} >= ${filters.dateFrom.toISOString()}`);
  }
  if (filters.dateTo) {
    conditions.push(sql`${timeEntries.loggedAt} <= ${filters.dateTo.toISOString()}`);
  }
  const where = and(...conditions);

  const [{ total = 0, total_minutes = 0 } = {}] = await db
    .select({
      total: sql<number>`count(*)`,
      total_minutes: sql<number>`coalesce(sum(${timeEntries.minutes}), 0)`,
    })
    .from(timeEntries)
    .where(where);

  const rows = await db
    .select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      projectName: projects.name,
      taskId: timeEntries.taskId,
      taskTitle: tasks.title,
      userId: timeEntries.userId,
      userName: user.name,
      minutes: timeEntries.minutes,
      description: timeEntries.description,
      loggedAt: timeEntries.loggedAt,
      createdAt: timeEntries.createdAt,
    })
    .from(timeEntries)
    .leftJoin(projects, eq(timeEntries.projectId, projects.id))
    .leftJoin(tasks, eq(timeEntries.taskId, tasks.id))
    .leftJoin(user, eq(timeEntries.userId, user.id))
    .where(where)
    .orderBy(desc(timeEntries.loggedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    entries: rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      taskId: r.taskId,
      taskTitle: r.taskTitle,
      userId: r.userId,
      userName: r.userName ?? "Unknown",
      minutes: r.minutes,
      description: r.description,
      loggedAt: r.loggedAt,
      createdAt: r.createdAt,
      // Extra field consumers can read off the unioned type when present.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      projectName: (r as any).projectName ?? null,
    })),
    pagination: {
      page,
      pageSize,
      total: Number(total ?? 0),
      totalPages: Math.max(1, Math.ceil(Number(total ?? 0) / pageSize)),
    },
    totalMinutes: Number(total_minutes ?? 0),
  };
}

export type OrgTimeSummary = {
  weekMinutes: number;
  monthMinutes: number;
  allTimeMinutes: number;
};

export async function getOrgTimeSummary(userId: string): Promise<OrgTimeSummary> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) return { weekMinutes: 0, monthMinutes: 0, allTimeMinutes: 0 };

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [row] = await db
    .select({
      week: sql<number>`coalesce(sum(case when ${timeEntries.loggedAt} >= ${weekAgo.toISOString()} then ${timeEntries.minutes} else 0 end), 0)`,
      month: sql<number>`coalesce(sum(case when ${timeEntries.loggedAt} >= ${monthAgo.toISOString()} then ${timeEntries.minutes} else 0 end), 0)`,
      all: sql<number>`coalesce(sum(${timeEntries.minutes}), 0)`,
    })
    .from(timeEntries)
    .where(eq(timeEntries.organizationId, ctx.organizationId));

  return {
    weekMinutes: Number(row?.week ?? 0),
    monthMinutes: Number(row?.month ?? 0),
    allTimeMinutes: Number(row?.all ?? 0),
  };
}

export async function getProjectTimeSummary(
  userId: string,
  projectId: string,
): Promise<ProjectTimeSummary> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) return { totalMinutes: 0, entryCount: 0 };

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${timeEntries.minutes}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(timeEntries)
    .where(
      and(eq(timeEntries.projectId, projectId), eq(timeEntries.organizationId, ctx.organizationId)),
    );

  return {
    totalMinutes: Number(row?.total ?? 0),
    entryCount: Number(row?.count ?? 0),
  };
}
