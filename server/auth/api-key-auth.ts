import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { apiKeys } from "@/db/schema";
import { hashApiKey } from "@/lib/auth/api-key-hash";

export { hashApiKey };

export type ApiKeyAuthResult = {
  organizationId: string;
  keyId: string;
};

/**
 * Validates an API key from an `X-API-Key` header value.
 * Returns the associated organizationId and keyId on success,
 * or null if the key is invalid, revoked, or expired.
 *
 * Updates `lastUsedAt` fire-and-forget on success.
 */
export async function validateApiKey(raw: string): Promise<ApiKeyAuthResult | null> {
  const hash = hashApiKey(raw);
  const now = new Date();

  const [row] = await db
    .select({
      id: apiKeys.id,
      organizationId: apiKeys.organizationId,
      expiresAt: apiKeys.expiresAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, hash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!row) return null;
  if (row.expiresAt && row.expiresAt < now) return null;

  // Update lastUsedAt without blocking the response
  db.update(apiKeys)
    .set({ lastUsedAt: now, updatedAt: now })
    .where(eq(apiKeys.id, row.id))
    .catch(console.error);

  return { organizationId: row.organizationId, keyId: row.id };
}
