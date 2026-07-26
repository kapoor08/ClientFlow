import "server-only";

import { sql } from "drizzle-orm";
import { poolDb } from "@/server/db/pool-client";

type PoolTx = Parameters<Parameters<typeof poolDb.transaction>[0]>[0];

/**
 * Sets the `app.current_org_id` Postgres GUC for the current transaction. This
 * is what the RLS policies in `scripts/rls/01-create-policies.sql` read to
 * decide which rows are visible.
 *
 * Runs on the **pooled** client (`poolDb`): the GUC set via `SET LOCAL` must
 * stay in scope for the queries that follow in the same transaction, which the
 * stateless `neon-http` client cannot do (and its `.transaction()` throws — the
 * reason the previous version of this file was inert dead code). See
 * `pool-client.ts`.
 *
 * Use inside a pooled transaction:
 *
 *   await withTenant(orgId, async (tx) => {
 *     // …queries here are filtered by RLS once FORCE + rollout are done
 *   });
 *
 * Why `SET LOCAL` (not `SET`): the value lives only for the duration of the
 * transaction, so a pooled connection returned to the pool can't leak a stale
 * org context to the next checkout.
 *
 * **Status:** functional and DB-verified, but intentionally UNUSED. RLS
 * enforcement was assessed and **deliberately skipped** for this app (P2-1 in
 * docs/enterprise-readiness-audit.md): it's a defense-in-depth backstop, the
 * primary isolation (per-query `WHERE organizationId` + `assertSameTenant`)
 * already works, and enabling RLS would fight the serverless/`neon-http`
 * architecture (this pooled path adds connection overhead) and require a new
 * non-`BYPASSRLS` DB role. Retained as a ready foundation should a compliance
 * requirement ever mandate RLS. To enable: FORCE on AND every tenant query
 * routed through here (non-routed queries return zero rows) AND the app
 * connecting as a non-`BYPASSRLS` role.
 */
export async function setTenantContext(tx: PoolTx, organizationId: string): Promise<void> {
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
 * Convenience wrapper: open a pooled transaction, set the tenant context, then
 * run the callback. Use for the common case of a single org-scoped read or
 * write once the RLS rollout is active.
 */
export async function withTenant<T>(
  organizationId: string,
  fn: (tx: PoolTx) => Promise<T>,
): Promise<T> {
  return poolDb.transaction(async (tx) => {
    await setTenantContext(tx, organizationId);
    return fn(tx);
  });
}
