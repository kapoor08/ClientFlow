import "server-only";

import { logger } from "@/server/observability/logger";

/**
 * Defence-in-depth: throw when a row's `organizationId` doesn't match the
 * caller's active org context. Detail fetchers already include the org in
 * their WHERE clauses, so under normal operation no row should ever fail
 * this check. The assertion exists to make a future refactor that drops the
 * org filter immediately loud and visible (instead of silently leaking
 * across tenants).
 *
 * Use:
 *   assertSameTenant(row.organizationId, ctx.organizationId, {
 *     entity: "client",
 *     entityId: row.id,
 *   });
 */
export class TenantMismatchError extends Error {
  constructor(
    public readonly entity: string,
    public readonly entityId: string,
    public readonly expectedOrgId: string,
    public readonly actualOrgId: string,
  ) {
    super(`Tenant mismatch on ${entity}: expected org ${expectedOrgId}, got ${actualOrgId}`);
    this.name = "TenantMismatchError";
  }
}

export function assertSameTenant(
  rowOrgId: string,
  ctxOrgId: string,
  meta: { entity: string; entityId: string },
): void {
  if (rowOrgId === ctxOrgId) return;
  // Always log - this is the kind of bug we want to see in Sentry the second
  // it happens, even if the throw is caught upstream.
  logger.error("tenant.mismatch", null, {
    entity: meta.entity,
    entityId: meta.entityId,
    expectedOrgId: ctxOrgId,
    actualOrgId: rowOrgId,
  });
  throw new TenantMismatchError(meta.entity, meta.entityId, ctxOrgId, rowOrgId);
}
