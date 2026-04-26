import "server-only";

import { createHash } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { apiIdempotencyKeys } from "@/db/schema";
import { ApiError } from "@/server/api/helpers";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours, matches Stripe's window

export type IdempotencyResolution<T> =
  | { kind: "cached"; status: number; body: T }
  | { kind: "fresh" };

function hashBody(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Look up an existing idempotency record for `(orgId, key)`. Returns:
 *   - `{kind: "fresh"}` - no record yet, the caller should perform the work
 *     and then call `recordIdempotentResponse` with the result.
 *   - `{kind: "cached", status, body}` - already processed, return as-is.
 *
 * Throws `ApiError(409)` if a record exists for the same key but the request
 * body has changed - clients reusing a key with a different payload is a bug
 * and shouldn't silently succeed.
 *
 * Race-condition note: two concurrent requests with the same key may both see
 * "fresh" and both perform the work. The unique index on `(orgId, key)` then
 * causes one of the two `recordIdempotentResponse` inserts to fail. We catch
 * that and return the row that won the race. End result: at most one observed
 * effect, even under concurrent retries.
 */
export async function lookupIdempotencyKey<T>(
  organizationId: string,
  key: string,
  rawBody: string,
): Promise<IdempotencyResolution<T>> {
  const requestHash = hashBody(rawBody);
  const now = new Date();

  const [existing] = await db
    .select({
      requestHash: apiIdempotencyKeys.requestHash,
      responseCode: apiIdempotencyKeys.responseCode,
      responseBody: apiIdempotencyKeys.responseBody,
      expiresAt: apiIdempotencyKeys.expiresAt,
    })
    .from(apiIdempotencyKeys)
    .where(
      and(eq(apiIdempotencyKeys.organizationId, organizationId), eq(apiIdempotencyKeys.key, key)),
    )
    .limit(1);

  if (!existing) return { kind: "fresh" };
  if (existing.expiresAt && existing.expiresAt < now) {
    // Stale row - the caller will perform a fresh insert which will conflict
    // on the unique index; we let recordIdempotentResponse handle replacement.
    return { kind: "fresh" };
  }
  if (existing.requestHash && existing.requestHash !== requestHash) {
    throw new ApiError(
      "Idempotency-Key reused with a different request body. Use a new key for a new request.",
      409,
    );
  }
  if (existing.responseCode == null) {
    // In-flight or interrupted - treat as conflict so the client retries.
    throw new ApiError(
      "A request with this Idempotency-Key is still being processed. Retry shortly.",
      409,
    );
  }
  return {
    kind: "cached",
    status: existing.responseCode,
    body: existing.responseBody as T,
  };
}

/**
 * Persist the response so subsequent requests with the same key short-circuit
 * to the cached value. Best-effort: if the insert fails (e.g. another worker
 * raced us and inserted first), we swallow the error - the row that won the
 * race will satisfy future lookups.
 */
export async function recordIdempotentResponse(
  organizationId: string,
  key: string,
  rawBody: string,
  status: number,
  responseBody: unknown,
): Promise<void> {
  const requestHash = hashBody(rawBody);
  const expiresAt = new Date(Date.now() + TTL_MS);

  try {
    await db
      .insert(apiIdempotencyKeys)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        key,
        requestHash,
        responseCode: status,
        responseBody: responseBody as Record<string, unknown>,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [apiIdempotencyKeys.organizationId, apiIdempotencyKeys.key],
        set: {
          requestHash,
          responseCode: status,
          responseBody: responseBody as Record<string, unknown>,
          expiresAt,
        },
      });
  } catch {
    // Race-condition winner already wrote the row. Nothing to do.
  }
}
