import "server-only";

import { createHash, randomBytes } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { apiKeys } from "@/db/schema";
import { db } from "@/server/db/client";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";

export type ApiKeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  isActive: boolean;
};

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateKey(): { raw: string; prefix: string; hash: string } {
  const raw = `cf_${randomBytes(32).toString("hex")}`;
  const prefix = raw.slice(0, 12);
  const hash = hashKey(raw);
  return { raw, prefix, hash };
}

export async function listApiKeysForUser(userId: string): Promise<ApiKeyItem[] | null> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) return null;

  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.organizationId, ctx.organizationId))
    .orderBy(desc(apiKeys.createdAt));

  return rows.map((r) => ({
    ...r,
    isActive: !r.revokedAt && (!r.expiresAt || r.expiresAt > new Date()),
  }));
}

export async function createApiKeyForUser(
  userId: string,
  name: string,
  expiresInDays?: number,
): Promise<{ id: string; key: string; prefix: string }> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings) throw new Error("Only admins can create API keys.");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Key name is required.");

  const { raw, prefix, hash } = generateKey();
  const id = crypto.randomUUID();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86_400_000)
    : null;

  await db.insert(apiKeys).values({
    id,
    organizationId: ctx.organizationId,
    name: trimmed,
    keyHash: hash,
    keyPrefix: prefix,
    createdByUserId: userId,
    expiresAt,
  });

  return { id, key: raw, prefix };
}

export async function revokeApiKeyForUser(userId: string, keyId: string): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings) throw new Error("Only admins can revoke API keys.");

  const [existing] = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.organizationId, ctx.organizationId)))
    .limit(1);

  if (!existing) throw new Error("API key not found.");

  await db
    .update(apiKeys)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}

export async function deleteApiKeyForUser(userId: string, keyId: string): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings) throw new Error("Only admins can delete API keys.");

  const [existing] = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.organizationId, ctx.organizationId)))
    .limit(1);

  if (!existing) throw new Error("API key not found.");

  await db.delete(apiKeys).where(eq(apiKeys.id, keyId));
}
