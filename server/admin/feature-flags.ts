import "server-only";

import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  featureFlags,
  featureFlagOverrides,
  organizations,
  platformAdminActions,
} from "@/db/schema";
import { FEATURE_FLAG_KEYS, type FeatureFlagKey, clearFeatureFlagCache } from "@/lib/feature-flags";

export type AdminFeatureFlagRow = {
  key: FeatureFlagKey;
  description: string | null;
  enabled: boolean;
  seeded: boolean;
  overrideCount: number;
};

/**
 * Returns one row per canonical FEATURE_FLAG_KEYS entry, joined with the DB
 * row if it exists. A flag that is referenced in code but not yet seeded in
 * the DB shows as `seeded: false, enabled: false` so the admin can spot it
 * and create the row with a single click.
 */
export async function listFeatureFlagsForAdmin(): Promise<AdminFeatureFlagRow[]> {
  const [globalRows, overrideCounts] = await Promise.all([
    db
      .select({
        key: featureFlags.key,
        description: featureFlags.description,
        enabled: featureFlags.enabled,
      })
      .from(featureFlags),
    db
      .select({
        flagKey: featureFlagOverrides.flagKey,
        count: count(featureFlagOverrides.id),
      })
      .from(featureFlagOverrides)
      .groupBy(featureFlagOverrides.flagKey),
  ]);

  const byKey = new Map(globalRows.map((r) => [r.key, r]));
  const overridesByKey = new Map(overrideCounts.map((r) => [r.flagKey, r.count]));

  return FEATURE_FLAG_KEYS.map<AdminFeatureFlagRow>((key) => {
    const row = byKey.get(key);
    return {
      key,
      description: row?.description ?? null,
      enabled: Boolean(row?.enabled),
      seeded: Boolean(row),
      overrideCount: overridesByKey.get(key) ?? 0,
    };
  });
}

/**
 * Idempotent global flag upsert. Used both to seed a previously-unseeded key
 * and to flip an existing flag.
 */
export async function upsertFeatureFlag(
  key: FeatureFlagKey,
  input: { enabled: boolean; description?: string | null },
  adminUserId: string,
): Promise<void> {
  if (!FEATURE_FLAG_KEYS.includes(key)) {
    throw new Error(`Unknown feature flag key: ${key}`);
  }

  const [existing] = await db
    .select({
      id: featureFlags.id,
      enabled: featureFlags.enabled,
      description: featureFlags.description,
    })
    .from(featureFlags)
    .where(eq(featureFlags.key, key))
    .limit(1);

  if (existing) {
    await db
      .update(featureFlags)
      .set({
        enabled: input.enabled,
        description: input.description ?? existing.description,
        updatedAt: new Date(),
      })
      .where(eq(featureFlags.id, existing.id));
  } else {
    await db.insert(featureFlags).values({
      id: crypto.randomUUID(),
      key,
      description: input.description ?? null,
      enabled: input.enabled,
    });
  }

  await db.insert(platformAdminActions).values({
    id: crypto.randomUUID(),
    platformAdminUserId: adminUserId,
    action: existing ? "update_feature_flag" : "create_feature_flag",
    entityType: "feature_flag",
    entityId: key,
    beforeSnapshot: existing
      ? { enabled: existing.enabled, description: existing.description }
      : null,
    afterSnapshot: { enabled: input.enabled, description: input.description ?? null },
  });

  clearFeatureFlagCache();
}

export type FlagOverrideRow = {
  id: string;
  organizationId: string;
  organizationName: string;
  enabled: boolean;
  createdAt: Date;
};

export async function listOverridesForFlag(key: FeatureFlagKey): Promise<FlagOverrideRow[]> {
  return db
    .select({
      id: featureFlagOverrides.id,
      organizationId: featureFlagOverrides.organizationId,
      organizationName: organizations.name,
      enabled: featureFlagOverrides.enabled,
      createdAt: featureFlagOverrides.createdAt,
    })
    .from(featureFlagOverrides)
    .innerJoin(organizations, eq(featureFlagOverrides.organizationId, organizations.id))
    .where(eq(featureFlagOverrides.flagKey, key))
    .orderBy(desc(featureFlagOverrides.createdAt));
}

export async function upsertFlagOverride(
  key: FeatureFlagKey,
  organizationId: string,
  enabled: boolean,
  adminUserId: string,
): Promise<void> {
  if (!FEATURE_FLAG_KEYS.includes(key)) {
    throw new Error(`Unknown feature flag key: ${key}`);
  }

  const [existing] = await db
    .select({ id: featureFlagOverrides.id, enabled: featureFlagOverrides.enabled })
    .from(featureFlagOverrides)
    .where(
      and(
        eq(featureFlagOverrides.flagKey, key),
        eq(featureFlagOverrides.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(featureFlagOverrides)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(featureFlagOverrides.id, existing.id));
  } else {
    await db.insert(featureFlagOverrides).values({
      id: crypto.randomUUID(),
      flagKey: key,
      organizationId,
      enabled,
    });
  }

  await db.insert(platformAdminActions).values({
    id: crypto.randomUUID(),
    platformAdminUserId: adminUserId,
    action: existing ? "update_flag_override" : "create_flag_override",
    entityType: "feature_flag_override",
    entityId: key,
    organizationId,
    beforeSnapshot: existing ? { enabled: existing.enabled } : null,
    afterSnapshot: { enabled },
  });

  clearFeatureFlagCache();
}

export async function deleteFlagOverride(
  key: FeatureFlagKey,
  organizationId: string,
  adminUserId: string,
): Promise<void> {
  await db
    .delete(featureFlagOverrides)
    .where(
      and(
        eq(featureFlagOverrides.flagKey, key),
        eq(featureFlagOverrides.organizationId, organizationId),
      ),
    );

  await db.insert(platformAdminActions).values({
    id: crypto.randomUUID(),
    platformAdminUserId: adminUserId,
    action: "delete_flag_override",
    entityType: "feature_flag_override",
    entityId: key,
    organizationId,
  });

  clearFeatureFlagCache();
}

export type OrgPickerRow = { id: string; name: string; slug: string };

/**
 * Lightweight org search for the override picker. Caps results at 20 - the
 * admin types and we filter, no pagination needed in a popover.
 */
export async function searchOrganizationsForPicker(query: string): Promise<OrgPickerRow[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const pattern = `%${q}%`;
  return db
    .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .where(or(ilike(organizations.name, pattern), ilike(organizations.slug, pattern)))
    .orderBy(asc(organizations.name))
    .limit(20);
}
