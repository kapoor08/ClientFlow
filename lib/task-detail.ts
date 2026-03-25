import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { tasks, projects, taskBoardColumns } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";

export type TaskDetail = {
  id: string;
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
  reporterUserId: string | null;
  reporterName: string | null;
  dueDate: Date | null;
  estimateMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
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
      reporterUserId: tasks.reporterUserId,
      reporterName: reporterUser.name,
      dueDate: tasks.dueDate,
      estimateMinutes: tasks.estimateMinutes,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
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
  return row;
}
