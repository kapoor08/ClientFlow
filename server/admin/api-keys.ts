import "server-only";

import { and, count, desc, eq, gt, ilike, isNotNull, isNull, lt, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import { organizations, apiKeys } from "@/db/schema";
import { user } from "@/db/auth-schema";
import {
  buildPaginationMeta,
  paginationOffset,
  type PaginatedResult,
} from "@/utils/pagination";

export type AdminApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  orgName: string;
  creatorName: string | null;
  creatorEmail: string | null;
};

type ListAdminApiKeysOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
  status?: string;
};

export async function listAdminApiKeys(
  opts: ListAdminApiKeysOptions = {},
): Promise<PaginatedResult<AdminApiKeyRow>> {
  const { query, page = 1, pageSize = 20, status } = opts;

  // ── WHERE conditions ────────────────────────────────────────────────────────
  const conditions = [];
  const now = new Date();

  if (query?.trim()) {
    const q = `%${query.trim()}%`;
    conditions.push(
      or(ilike(apiKeys.name, q), ilike(organizations.name, q))!,
    );
  }
  if (status === "active") {
    conditions.push(isNull(apiKeys.revokedAt));
    conditions.push(or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, now))!);
  }
  if (status === "revoked") conditions.push(isNotNull(apiKeys.revokedAt));
  if (status === "expired") {
    conditions.push(isNull(apiKeys.revokedAt));
    conditions.push(isNotNull(apiKeys.expiresAt));
    conditions.push(lt(apiKeys.expiresAt, now));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count(apiKeys.id) })
    .from(apiKeys)
    .innerJoin(organizations, eq(apiKeys.organizationId, organizations.id))
    .where(where);

  const pagination = buildPaginationMeta(total, page, pageSize);

  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      revokedAt: apiKeys.revokedAt,
      orgName: organizations.name,
      creatorName: user.name,
      creatorEmail: user.email,
    })
    .from(apiKeys)
    .innerJoin(organizations, eq(apiKeys.organizationId, organizations.id))
    .leftJoin(user, eq(apiKeys.createdByUserId, user.id))
    .where(where)
    .orderBy(desc(apiKeys.createdAt))
    .limit(pagination.pageSize)
    .offset(paginationOffset(pagination.page, pagination.pageSize));

  return { data: rows, pagination };
}

export async function revokeApiKey(keyId: string) {
  await db.update(apiKeys).set({ revokedAt: new Date(), updatedAt: new Date() }).where(eq(apiKeys.id, keyId));
}

export async function deleteApiKey(keyId: string) {
  await db.delete(apiKeys).where(eq(apiKeys.id, keyId));
}
