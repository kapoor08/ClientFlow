import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";

/**
 * Sets the `app.current_org_id` Postgres GUC for the current transaction.
 * This is what the RLS policies in `scripts/rls/01-create-policies.sql` read
 * to decide which rows are visible.
 *
 * **Status:** wired but inert until RLS is enabled per-table per the staged
 * rollout plan in `scripts/rls/README.md`. Calling this when RLS is disabled
 * is a no-op cost (one round-trip), so it's safe to wire in everywhere.
 *
 * Use inside a Drizzle transaction:
 *
 *   await db.transaction(async (tx) => {
 *     await setTenantContext(tx, orgId);
 *     // … any queries here will be filtered by RLS once enabled
 *   });
 *
 * Why `SET LOCAL` (not `SET`): the value lives only for the duration of the
 * transaction. Without LOCAL, the setting persists for the connection - and
 * because Neon pools connections, the next request on the same connection
 * could leak a stale org context.
 */
export async function setTenantContext(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  organizationId: string,
): Promise<void> {
  // Defensive: validate the org id is a non-empty string. A malformed value
  // here would still be safely rejected by RLS (no rows match) but failing
  // fast surfaces the bug at the call site instead of as "queries return
  // empty" symptoms.
  if (typeof organizationId !== "string" || !organizationId) {
    throw new Error("setTenantContext: organizationId is required.");
  }
  // Use sql.raw because SET LOCAL doesn't accept parameter binding for the
  // value. The value is interpolated into a quoted literal; we strip any
  // single quotes defensively even though a UUID/cuid won't contain one.
  const safe = organizationId.replace(/'/g, "");
  await tx.execute(sql.raw(`SET LOCAL app.current_org_id = '${safe}'`));
}

/**
 * Convenience wrapper: open a transaction, set the tenant context, then run
 * the callback. Use for the common case of a single org-scoped read or write.
 */
export async function withTenant<T>(
  organizationId: string,
  fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await setTenantContext(tx, organizationId);
    return fn(tx);
  });
}
