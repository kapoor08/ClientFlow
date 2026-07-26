import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Set NEON_DATABASE_URL or DATABASE_URL in your environment before using the pooled database client",
  );
}

/**
 * Pooled (WebSocket) database client — the counterpart to the stateless
 * `neon-http` client in `client.ts`.
 *
 * Why this exists (P2-1): RLS policies read `current_setting('app.current_org_id')`,
 * which must be `SET LOCAL` inside the *same* transaction as the query. The
 * `neon-http` client sends each query as an independent HTTP request, so a
 * `SET LOCAL` never carries over — and its `.transaction()` throws outright.
 * A pooled connection stays open for the duration of a transaction, so the GUC
 * set at the start of the tx is in scope for every query in it. This client
 * backs `withTenant()` in `with-tenant.ts`.
 *
 * **Status:** wired and DB-verified, but intentionally UNUSED. RLS enforcement
 * was assessed and **deliberately skipped** for this app (P2-1 in
 * docs/enterprise-readiness-audit.md) — tenant isolation is already handled by
 * per-query `WHERE organizationId` + `assertSameTenant`, and enabling RLS would
 * require a non-`BYPASSRLS` DB role plus routing every tenant query through the
 * pooled path. This client is retained as a ready foundation for `withTenant()`
 * should a compliance mandate ever require DB-level RLS. When connecting, the
 * Neon Pool needs a global `WebSocket` (Node >= 22).
 */
const pool = new Pool({ connectionString });

export const poolDb = drizzle(pool);
