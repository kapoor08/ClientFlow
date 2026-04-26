import { and, eq, gt, gte, isNotNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { tasks, taskAssignees } from "@/db/schema";
import { dispatchNotification } from "@/server/notifications/data";
import { assertCronAuth, runCron } from "@/server/cron/guard";
import { logger } from "@/server/observability/logger";

/**
 * Daily task notifications - runs at 08:00 UTC.
 *
 * 1. Due-soon: tasks due in the next 24 hours (not completed/cancelled).
 * 2. Overdue: tasks past their due date (not completed/cancelled), gated by
 *    `lastOverdueNotifiedAt` so the same task doesn't fire again within 24h.
 */
export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  return runCron("task-notifications", async () => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const results: Record<string, number | string> = {};

    // Helper: collect assignee + reporter user IDs for a task
    async function recipientsForTask(
      taskId: string,
      reporterUserId: string | null,
    ): Promise<string[]> {
      const assignees = await db
        .select({ userId: taskAssignees.userId })
        .from(taskAssignees)
        .where(eq(taskAssignees.taskId, taskId));
      const ids = new Set<string>(assignees.map((a) => a.userId));
      if (reporterUserId) ids.add(reporterUserId);
      return Array.from(ids);
    }

    // ── 1. Due-soon ────────────────────────────────────────────────────────────
    try {
      const dueSoon = await db
        .select({
          id: tasks.id,
          organizationId: tasks.organizationId,
          title: tasks.title,
          dueDate: tasks.dueDate,
          reporterUserId: tasks.reporterUserId,
        })
        .from(tasks)
        .where(
          and(
            isNotNull(tasks.dueDate),
            gte(tasks.dueDate, now),
            lt(tasks.dueDate, in24h),
            ne(tasks.status, "completed"),
            ne(tasks.status, "cancelled"),
          ),
        );

      let dispatched = 0;
      for (const t of dueSoon) {
        const recipients = await recipientsForTask(t.id, t.reporterUserId);
        if (recipients.length === 0) continue;
        await dispatchNotification({
          organizationId: t.organizationId,
          recipientUserIds: recipients,
          eventKey: "task_due_soon",
          title: `Task due soon: ${t.title}`,
          body: t.dueDate ? `Due ${t.dueDate.toLocaleDateString("en-US")}` : undefined,
          url: `/tasks?task=${t.id}`,
          data: { taskId: t.id },
        });
        dispatched++;
      }
      results.dueSoonTasks = dispatched;
    } catch (err) {
      logger.error("cron.task_notifications.due_soon_failed", err);
      results.dueSoonTasks = "error";
    }

    // ── 2. Overdue ─────────────────────────────────────────────────────────────
    try {
      const overdue = await db
        .select({
          id: tasks.id,
          organizationId: tasks.organizationId,
          title: tasks.title,
          dueDate: tasks.dueDate,
          reporterUserId: tasks.reporterUserId,
        })
        .from(tasks)
        .where(
          and(
            isNotNull(tasks.dueDate),
            lt(tasks.dueDate, now),
            ne(tasks.status, "completed"),
            ne(tasks.status, "cancelled"),
            // Fire at most once per 24h per task
            or(
              sql`${tasks.lastOverdueNotifiedAt} IS NULL`,
              lt(tasks.lastOverdueNotifiedAt, last24h),
            ),
          ),
        );

      let dispatched = 0;
      for (const t of overdue) {
        const recipients = await recipientsForTask(t.id, t.reporterUserId);
        if (recipients.length === 0) continue;
        await dispatchNotification({
          organizationId: t.organizationId,
          recipientUserIds: recipients,
          eventKey: "task_overdue",
          title: `Task overdue: ${t.title}`,
          body: t.dueDate ? `Was due ${t.dueDate.toLocaleDateString("en-US")}` : undefined,
          url: `/tasks?task=${t.id}`,
          data: { taskId: t.id },
        });
        await db.update(tasks).set({ lastOverdueNotifiedAt: now }).where(eq(tasks.id, t.id));
        dispatched++;
      }
      results.overdueTasks = dispatched;
    } catch (err) {
      logger.error("cron.task_notifications.overdue_failed", err);
      results.overdueTasks = "error";
    }

    // Silence the `gt` import - kept in case future due-soon windows shift.
    void gt;

    logger.info("cron.task_notifications.done", results);
    return results;
  });
}
