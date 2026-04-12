import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { taskBoardColumns, tasks } from "@/db/schema";
import { db } from "@/server/db/client";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";

export type BoardColumnRecord = {
  id: string;
  name: string;
  color: string;
  columnType: string | null;
  description: string | null;
  position: number;
};

export const DEFAULT_COLUMNS: Omit<BoardColumnRecord, "id">[] = [
  { name: "To Do", color: "#3b82f6", columnType: "todo", description: null, position: 0 },
  { name: "In Progress", color: "#f59e0b", columnType: "in_progress", description: null, position: 1 },
  { name: "Testing / QA", color: "#8b5cf6", columnType: "testing_qa", description: null, position: 2 },
  { name: "Completed", color: "#10b981", columnType: "completed", description: null, position: 3 },
];

export async function listBoardColumnsForUser(userId: string): Promise<BoardColumnRecord[] | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const rows = await db
    .select({
      id: taskBoardColumns.id,
      name: taskBoardColumns.name,
      color: taskBoardColumns.color,
      columnType: taskBoardColumns.columnType,
      description: taskBoardColumns.description,
      position: taskBoardColumns.position,
    })
    .from(taskBoardColumns)
    .where(eq(taskBoardColumns.organizationId, context.organizationId))
    .orderBy(asc(taskBoardColumns.position));

  return rows;
}

export async function ensureDefaultColumns(organizationId: string): Promise<void> {
  // Fetch existing column types for this org
  const existing = await db
    .select({ columnType: taskBoardColumns.columnType })
    .from(taskBoardColumns)
    .where(eq(taskBoardColumns.organizationId, organizationId));

  const existingTypes = new Set(existing.map((r) => r.columnType).filter(Boolean));

  const missing = DEFAULT_COLUMNS.filter(
    (col) => col.columnType && !existingTypes.has(col.columnType),
  );

  if (missing.length === 0) return;

  await db.insert(taskBoardColumns).values(
    missing.map((col) => ({
      id: crypto.randomUUID(),
      organizationId,
      name: col.name,
      color: col.color,
      columnType: col.columnType,
      description: col.description,
      position: col.position,
    })),
  );
}

/**
 * Removes duplicate columns (same columnType), keeping the one with the
 * lowest position. Call once on page load to clean up any race-condition dupes.
 */
export async function deduplicateColumns(organizationId: string): Promise<void> {
  const rows = await db
    .select({
      id: taskBoardColumns.id,
      columnType: taskBoardColumns.columnType,
      position: taskBoardColumns.position,
    })
    .from(taskBoardColumns)
    .where(
      eq(taskBoardColumns.organizationId, organizationId),
    )
    .orderBy(asc(taskBoardColumns.position));

  // Group by columnType, keep the first (lowest position) of each typed column
  const seen = new Map<string, string>(); // columnType → keep id
  const toDelete: string[] = [];

  for (const row of rows) {
    if (!row.columnType) continue;
    if (seen.has(row.columnType)) {
      toDelete.push(row.id);
    } else {
      seen.set(row.columnType, row.id);
    }
  }

  if (toDelete.length === 0) return;

  // Reassign tasks from duplicate columns to the kept column
  for (const dupId of toDelete) {
    const keepType = rows.find((r) => r.id === dupId)?.columnType;
    const keepId = keepType ? seen.get(keepType) : undefined;
    if (keepId) {
      await db
        .update(tasks)
        .set({ columnId: keepId, updatedAt: new Date() })
        .where(eq(tasks.columnId, dupId));
    }
  }

  await db
    .delete(taskBoardColumns)
    .where(inArray(taskBoardColumns.id, toDelete));
}

export async function createBoardColumnForUser(
  userId: string,
  input: {
    name: string;
    color: string;
    columnType?: string | null;
    description?: string | null;
  },
): Promise<{ columnId: string }> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  const [maxPositionResult] = await db
    .select({ maxPosition: taskBoardColumns.position })
    .from(taskBoardColumns)
    .where(eq(taskBoardColumns.organizationId, context.organizationId))
    .orderBy(asc(taskBoardColumns.position));

  const existingColumns = await db
    .select({ position: taskBoardColumns.position })
    .from(taskBoardColumns)
    .where(eq(taskBoardColumns.organizationId, context.organizationId))
    .orderBy(asc(taskBoardColumns.position));

  const nextPosition =
    existingColumns.length > 0
      ? Math.max(...existingColumns.map((c) => c.position)) + 1
      : 0;

  void maxPositionResult;

  const columnId = crypto.randomUUID();

  await db.insert(taskBoardColumns).values({
    id: columnId,
    organizationId: context.organizationId,
    name: input.name.trim(),
    color: input.color,
    columnType: input.columnType ?? null,
    description: input.description?.trim() ?? null,
    position: nextPosition,
  });

  return { columnId };
}

export async function updateBoardColumnForUser(
  userId: string,
  columnId: string,
  input: {
    name?: string;
    color?: string;
    columnType?: string | null;
    description?: string | null;
  },
): Promise<void> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  const [existing] = await db
    .select({ id: taskBoardColumns.id })
    .from(taskBoardColumns)
    .where(eq(taskBoardColumns.id, columnId))
    .limit(1);

  if (!existing) throw new Error("Column not found.");

  const updates: Partial<typeof taskBoardColumns.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.color !== undefined) updates.color = input.color;
  if (input.columnType !== undefined) updates.columnType = input.columnType;
  if (input.description !== undefined) updates.description = input.description?.trim() ?? null;

  await db.update(taskBoardColumns).set(updates).where(eq(taskBoardColumns.id, columnId));
}

export async function deleteBoardColumnForUser(
  userId: string,
  columnId: string,
): Promise<void> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  const [existing] = await db
    .select({ id: taskBoardColumns.id })
    .from(taskBoardColumns)
    .where(eq(taskBoardColumns.id, columnId))
    .limit(1);

  if (!existing) throw new Error("Column not found.");

  // Move tasks in this column to null
  await db
    .update(tasks)
    .set({ columnId: null, updatedAt: new Date() })
    .where(eq(tasks.columnId, columnId));

  await db.delete(taskBoardColumns).where(eq(taskBoardColumns.id, columnId));
}

export async function reorderBoardColumnsForUser(
  userId: string,
  orderedIds: string[],
): Promise<void> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  if (orderedIds.length === 0) return;

  // Verify all columns belong to this org
  const existing = await db
    .select({ id: taskBoardColumns.id })
    .from(taskBoardColumns)
    .where(
      inArray(taskBoardColumns.id, orderedIds),
    );

  const existingIds = new Set(existing.map((c) => c.id));

  await Promise.all(
    orderedIds.map((id, index) => {
      if (!existingIds.has(id)) return Promise.resolve();
      return db
        .update(taskBoardColumns)
        .set({ position: index, updatedAt: new Date() })
        .where(eq(taskBoardColumns.id, id));
    }),
  );
}
