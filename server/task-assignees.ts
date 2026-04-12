import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { taskAssignees, taskAuditLogs, tasks } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { db } from "@/server/db/client";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";

export async function updateTaskAssigneesForUser(
  userId: string,
  taskId: string,
  userIds: string[],
): Promise<void> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  const [task] = await db
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

  if (!task) throw new Error("Task not found.");

  // Fetch current assignees before clearing
  const existing = await db
    .select({ userId: taskAssignees.userId, name: user.name })
    .from(taskAssignees)
    .leftJoin(user, eq(taskAssignees.userId, user.id))
    .where(eq(taskAssignees.taskId, taskId));

  await db.delete(taskAssignees).where(eq(taskAssignees.taskId, taskId));

  if (userIds.length > 0) {
    await db.insert(taskAssignees).values(
      userIds.map((uid) => ({
        id: crypto.randomUUID(),
        taskId,
        userId: uid,
      })),
    );
  }

  // Fetch new assignee names for the log
  const newUsers =
    userIds.length > 0
      ? await db
          .select({ userId: user.id, name: user.name })
          .from(user)
          .where(inArray(user.id, userIds))
      : [];

  const oldNames = existing.map((a) => a.name ?? a.userId);
  const newNames = newUsers.map((u) => u.name ?? u.userId);

  db.insert(taskAuditLogs)
    .values({
      id: crypto.randomUUID(),
      organizationId: context.organizationId,
      taskId,
      actorUserId: userId,
      action: "assignees.changed",
      oldValues: { names: oldNames },
      newValues: { names: newNames },
    })
    .catch(console.error);
}
