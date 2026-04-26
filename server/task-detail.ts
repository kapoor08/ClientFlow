import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { tasks, projects, taskBoardColumns } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { db } from "@/server/db/client";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { assertSameTenant } from "@/server/auth/tenant-guard";

export type TaskDetail = {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  projectId: string;
  projectName: string | null;
  columnId: string | null;
  columnName: string | null;
  columnColor: string | null;
  assigneeUserId: string | null;
  assigneeName: string | null;
  assignees: { userId: string; name: string | null }[];
  reporterUserId: string | null;
  reporterName: string | null;
  dueDate: Date | null;
  estimateMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
  refNumber: string | null;
  tags: string[];
};

export async function getTaskDetailForUser(
  userId: string,
  taskId: string,
): Promise<TaskDetail | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const assigneeUser = alias(user, "assignee_user");
  const reporterUser = alias(user, "reporter_user");

  const [row] = await db
    .select({
      id: tasks.id,
      organizationId: tasks.organizationId,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      projectId: tasks.projectId,
      projectName: projects.name,
      columnId: tasks.columnId,
      columnName: taskBoardColumns.name,
      columnColor: taskBoardColumns.color,
      assigneeUserId: tasks.assigneeUserId,
      assigneeName: assigneeUser.name,
      reporterUserId: sql<string | null>`
        COALESCE(
          ${tasks.reporterUserId},
          (SELECT actor_user_id FROM task_audit_logs WHERE task_id = ${tasks.id} ORDER BY created_at LIMIT 1)
        )
      `,
      reporterName: sql<string | null>`
        COALESCE(
          ${reporterUser.name},
          (SELECT u.name FROM task_audit_logs tal JOIN "user" u ON u.id = tal.actor_user_id WHERE tal.task_id = ${tasks.id} ORDER BY tal.created_at LIMIT 1)
        )
      `,
      dueDate: tasks.dueDate,
      estimateMinutes: tasks.estimateMinutes,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      refNumber: tasks.refNumber,
      tags: tasks.tags,
      assignees: sql<{ userId: string; name: string | null }[]>`
        COALESCE(
          (SELECT json_agg(json_build_object('userId', ta.user_id, 'name', u.name) ORDER BY ta.created_at)
           FROM task_assignees ta
           JOIN "user" u ON u.id = ta.user_id
           WHERE ta.task_id = ${tasks.id}),
          '[]'::json
        )
      `,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(taskBoardColumns, eq(tasks.columnId, taskBoardColumns.id))
    .leftJoin(assigneeUser, eq(tasks.assigneeUserId, assigneeUser.id))
    .leftJoin(reporterUser, eq(tasks.reporterUserId, reporterUser.id))
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.organizationId, context.organizationId),
        isNull(tasks.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return null;
  assertSameTenant(row.organizationId, context.organizationId, {
    entity: "task",
    entityId: row.id,
  });
  return row;
}
