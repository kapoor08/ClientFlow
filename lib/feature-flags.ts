import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { featureFlags, featureFlagOverrides } from "@/db/schema";

/**
 * Canonical list of feature-flag keys used in the codebase. Keep this source
 * of truth here - TypeScript will then refuse any call to `isFeatureEnabled`
 * with an unknown key, so flag references can never silently rot.
 *
 * Format: `<area>.<feature>` - keep it short and human-readable, the admin UI
 * shows raw keys.
 */
export const FEATURE_FLAG_KEYS = [
  "billing.proration_preview",
  "billing.downgrade_self_service",
  "search.ai_assist",
  "support.live_chat",
  "ux.command_palette_data",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

const ttlMs = 60_000; // cache flag resolution for 60s per process

type CacheEntry = { value: boolean; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function cacheKey(key: FeatureFlagKey, organizationId: string | null): string {
  return `${key}::${organizationId ?? "_global"}`;
}

/**
 * Resolve a single flag for an organization (or globally if no org context).
 *
 * Resolution order:
 *   1. Per-org override row → wins if present
 *   2. Global featureFlags.enabled
 *   3. Default false (flag not seeded yet → off)
 */
export async function isFeatureEnabled(
  key: FeatureFlagKey,
  organizationId: string | null = null,
): Promise<boolean> {
  const ck = cacheKey(key, organizationId);
  const hit = cache.get(ck);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  let value = false;

  if (organizationId) {
    const [override] = await db
      .select({ enabled: featureFlagOverrides.enabled })
      .from(featureFlagOverrides)
      .where(
        and(
          eq(featureFlagOverrides.flagKey, key),
          eq(featureFlagOverrides.organizationId, organizationId),
        ),
      )
      .limit(1);
    if (override) {
      value = override.enabled;
      cache.set(ck, { value, expiresAt: Date.now() + ttlMs });
      return value;
    }
  }

  const [global] = await db
    .select({ enabled: featureFlags.enabled })
    .from(featureFlags)
    .where(eq(featureFlags.key, key))
    .limit(1);
  value = Boolean(global?.enabled);

  cache.set(ck, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

/**
 * Bulk variant - used by the page shell to fetch all flags relevant to an
 * org in one round trip rather than one query per flag.
 */
export async function getEnabledFlags(
  keys: readonly FeatureFlagKey[],
  organizationId: string | null = null,
): Promise<Record<FeatureFlagKey, boolean>> {
  const result = Object.fromEntries(keys.map((k) => [k, false])) as Record<FeatureFlagKey, boolean>;

  const [globalRows, overrideRows] = await Promise.all([
    db
      .select({ key: featureFlags.key, enabled: featureFlags.enabled })
      .from(featureFlags)
      .where(inArray(featureFlags.key, [...keys] as string[])),
    organizationId
      ? db
          .select({
            key: featureFlagOverrides.flagKey,
            enabled: featureFlagOverrides.enabled,
          })
          .from(featureFlagOverrides)
          .where(
            and(
              eq(featureFlagOverrides.organizationId, organizationId),
              inArray(featureFlagOverrides.flagKey, [...keys] as string[]),
            ),
          )
      : Promise.resolve([] as { key: string; enabled: boolean }[]),
  ]);

  for (const row of globalRows) {
    if (row.key in result) result[row.key as FeatureFlagKey] = row.enabled;
  }
  // Overrides win.
  for (const row of overrideRows) {
    if (row.key in result) result[row.key as FeatureFlagKey] = row.enabled;
  }
  return result;
}

/** Bust the in-process cache after an admin flip. */
export function clearFeatureFlagCache(): void {
  cache.clear();
}
