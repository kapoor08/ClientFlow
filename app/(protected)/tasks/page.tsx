import type { Metadata } from "next";
import { getServerSession } from "@/lib/get-session";
import { listTasksForUser } from "@/lib/tasks";
import {
  listBoardColumnsForUser,
  ensureDefaultColumns,
  deduplicateColumns,
} from "@/lib/task-columns";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import TasksPage from ".";
import type { TaskListResponse } from "@/core/tasks/entity";
import type { BoardColumnsResponse } from "@/core/task-columns/entity";

export const metadata: Metadata = {
  title: "Tasks",
};

export default async function Page() {
  const session = await getServerSession();
  const userId = session!.user.id;

  const context = await getOrganizationSettingsContextForUser(userId);
  if (context) {
    await deduplicateColumns(context.organizationId);
    await ensureDefaultColumns(context.organizationId);
  }

  const [result, columnsRaw] = await Promise.all([
    listTasksForUser(userId, { pageSize: 200 }),
    listBoardColumnsForUser(userId),
  ]);

  const initialData: TaskListResponse | undefined = result
    ? {
        tasks: result.tasks.map((t) => ({
          ...t,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
          estimateSetAt: t.estimateSetAt ? t.estimateSetAt.toISOString() : null,
          columnId: t.columnId ?? null,
          refNumber: t.refNumber ?? null,
          tags: t.tags ?? [],
        })),
        pagination: result.pagination,
      }
    : undefined;

  const initialColumns: BoardColumnsResponse = {
    columns: columnsRaw ?? [],
  };

  return (
    <TasksPage
      initialData={initialData}
      initialColumns={initialColumns}
      currentUserId={userId}
    />
  );
}
