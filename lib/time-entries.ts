import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { timeEntries, projects, tasks } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { writeAuditLog } from "@/lib/audit";

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

  // Verify project belongs to the org
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, input.projectId),
        eq(projects.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!project) throw new Error("Project not found.");

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
    metadata: { projectId: input.projectId, minutes: input.minutes },
  }).catch(console.error);

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
      and(
        eq(timeEntries.projectId, projectId),
        eq(timeEntries.organizationId, ctx.organizationId),
      ),
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
    .where(
      and(
        eq(timeEntries.taskId, taskId),
        eq(timeEntries.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(desc(timeEntries.loggedAt));

  return rows.map((r) => ({
    ...r,
    userName: r.userName ?? "Unknown",
  }));
}

export async function deleteTimeEntryForUser(
  userId: string,
  entryId: string,
): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");

  const [entry] = await db
    .select({ id: timeEntries.id, userId: timeEntries.userId })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.id, entryId),
        eq(timeEntries.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!entry) throw new Error("Time entry not found.");

  // Only the entry owner or admin can delete
  if (entry.userId !== userId && !ctx.canManageSettings) {
    throw new Error("You can only delete your own time entries.");
  }

  await db.delete(timeEntries).where(eq(timeEntries.id, entryId));
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
      and(
        eq(timeEntries.projectId, projectId),
        eq(timeEntries.organizationId, ctx.organizationId),
      ),
    );

  return {
    totalMinutes: Number(row?.total ?? 0),
    entryCount: Number(row?.count ?? 0),
  };
}
