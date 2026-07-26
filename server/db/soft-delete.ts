import { isNull, type Column } from "drizzle-orm";

/**
 * Canonical soft-delete predicate (P3-4).
 *
 * Five tables are soft-deletable - `organizations`, `clients`, `projects`,
 * `tasks`, `task_comments` - each carrying a nullable `deletedAt`. Every *live*
 * read of one of these tables must exclude tombstoned rows, otherwise deleted
 * records leak back into lists, counts and detail views.
 *
 * Use this in the WHERE clause alongside the tenant filter:
 *
 *   .where(and(eq(tasks.organizationId, orgId), notDeleted(tasks.deletedAt)))
 *
 * Omit it ONLY for admin / restore / GDPR-export paths that must see deleted
 * rows - and leave a comment at that call site saying so.
 */
export function notDeleted(deletedAtColumn: Column) {
  return isNull(deletedAtColumn);
}
