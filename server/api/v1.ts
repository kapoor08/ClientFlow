import "server-only";

import { ApiError } from "@/server/api/helpers";
import { validateApiKey } from "@/server/auth/api-key-auth";
import { apiKeyRatelimit, incrementApiKeyMonthlyUsage } from "@/server/rate-limit";

export type V1AuthContext = {
  organizationId: string;
  keyId: string;
};

/**
 * Strict API-key-only auth for the public `/api/v1/*` surface. Unlike the
 * internal `requireSessionOrApiKeyAuth` helper, this does NOT fall back to
 * the session cookie - third-party integrations should never accidentally
 * inherit a browser session.
 *
 * Also enforces the per-API-key rate limit (1,000 req/min). The IP-based
 * limit at the middleware layer is per source-IP; this is per credential, so
 * one noisy integration sharing an egress IP doesn't impact other tenants.
 *
 * Fire-and-forgets a monthly usage counter so the API-key UI can show
 * customers their current usage without an extra request log table.
 */
export async function requireV1Auth(request: Request): Promise<V1AuthContext> {
  const key = request.headers.get("x-api-key");
  if (!key) {
    throw new ApiError("Missing X-API-Key header.", 401);
  }
  const result = await validateApiKey(key);
  if (!result) {
    throw new ApiError("Invalid or expired API key.", 401);
  }

  // Per-key rate limit. Bucket on the key's id (not the raw secret) so log
  // queries can map throttling events back to a key without exposing the
  // secret in observability data.
  const { success } = await apiKeyRatelimit.limit(result.keyId);
  if (!success) {
    throw new ApiError("Rate limit exceeded for this API key. Try again in a few seconds.", 429);
  }

  // Best-effort monthly counter - never block the request on this.
  void incrementApiKeyMonthlyUsage(result.keyId).catch(() => {});

  return { organizationId: result.organizationId, keyId: result.keyId };
}

/**
 * Parse `?limit=` and `?offset=` for v1 list endpoints. Clamps to safe
 * bounds so a misbehaving client can't request a million-row page.
 */
export function parseV1Pagination(searchParams: URLSearchParams): {
  limit: number;
  offset: number;
} {
  const rawLimit = Number(searchParams.get("limit")) || 50;
  const rawOffset = Number(searchParams.get("offset")) || 0;
  return {
    limit: Math.min(Math.max(1, rawLimit), 200),
    offset: Math.max(0, rawOffset),
  };
}
