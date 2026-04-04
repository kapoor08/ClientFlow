import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { taskAssignees, tasks } from "@/db/schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";

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
}
