import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  organizations,
  organizationMemberships,
  roles,
  apiKeys,
  auditLogs,
  platformAdminActions,
} from "@/db/schema";
import { user, session } from "@/db/auth-schema";
import {
  buildPaginationMeta,
  paginationOffset,
  type PaginatedResult,
} from "@/utils/pagination";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean | null;
  isPlatformAdmin: boolean;
  createdAt: Date;
  orgCount: number;
};

type ListAdminUsersOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
  verified?: string;
  platformAdmin?: string;
};

const SORTABLE_COLUMNS = {
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
} as const;

export async function listAdminUsers(
  opts: ListAdminUsersOptions = {},
): Promise<PaginatedResult<AdminUserRow>> {
  const {
    query,
    page = 1,
    pageSize = 20,
    sort,
    order = "desc",
    verified,
    platformAdmin,
  } = opts;

  // ── WHERE conditions ────────────────────────────────────────────────────────
  const conditions = [];

  if (query?.trim()) {
    const q = `%${query.trim()}%`;
    conditions.push(or(ilike(user.name, q), ilike(user.email, q))!);
  }
  if (verified === "true") conditions.push(eq(user.emailVerified, true));
  if (verified === "false") conditions.push(eq(user.emailVerified, false));
  if (platformAdmin === "true") conditions.push(eq(user.isPlatformAdmin, true));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // ── Count ───────────────────────────────────────────────────────────────────
  const [{ total }] = await db
    .select({ total: count(user.id) })
    .from(user)
    .where(where);

  const pagination = buildPaginationMeta(total, page, pageSize);

  const sortCol =
    SORTABLE_COLUMNS[sort as keyof typeof SORTABLE_COLUMNS] ?? user.createdAt;
  const orderFn = order === "asc" ? asc : desc;

  // ── Fetch page ──────────────────────────────────────────────────────────────
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      isPlatformAdmin: user.isPlatformAdmin,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(where)
    .orderBy(orderFn(sortCol))
    .limit(pagination.pageSize)
    .offset(paginationOffset(pagination.page, pagination.pageSize));

  if (users.length === 0) {
    return { data: [], pagination };
  }

  const userIds = users.map((u) => u.id);

  const orgCounts = await db
    .select({
      userId: organizationMemberships.userId,
      count: count(organizationMemberships.id),
    })
    .from(organizationMemberships)
    .where(inArray(organizationMemberships.userId, userIds))
    .groupBy(organizationMemberships.userId);

  const orgCountMap = Object.fromEntries(orgCounts.map((r) => [r.userId, r.count]));

  return {
    data: users.map((u) => ({ ...u, orgCount: orgCountMap[u.id] ?? 0 })),
    pagination,
  };
}

export async function getAdminUserDetail(userId: string) {
  const [u] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!u) return null;

  const [userOrgs, userSessions, userApiKeys, userAuditLogs] = await Promise.all([
    db
      .select({
        orgId: organizations.id,
        orgName: organizations.name,
        orgSlug: organizations.slug,
        roleName: roles.name,
        roleKey: roles.key,
        status: organizationMemberships.status,
        joinedAt: organizationMemberships.joinedAt,
      })
      .from(organizationMemberships)
      .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
      .innerJoin(roles, eq(organizationMemberships.roleId, roles.id))
      .where(eq(organizationMemberships.userId, userId)),

    db
      .select({
        id: session.id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(eq(session.userId, userId))
      .orderBy(desc(session.createdAt)),

    db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
        revokedAt: apiKeys.revokedAt,
        expiresAt: apiKeys.expiresAt,
        lastUsedAt: apiKeys.lastUsedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.createdByUserId, userId))
      .orderBy(desc(apiKeys.createdAt)),

    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(eq(auditLogs.actorUserId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(20),
  ]);

  return { user: u, orgs: userOrgs, sessions: userSessions, apiKeys: userApiKeys, auditLogs: userAuditLogs };
}

export async function revokeAllUserSessions(userId: string, adminUserId: string) {
  const existing = await db.select({ id: session.id }).from(session).where(eq(session.userId, userId));
  await db.delete(session).where(eq(session.userId, userId));

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: adminUserId,
    action: "revoke_all_user_sessions",
    entityType: "user",
    entityId: userId,
    organizationId: null,
    afterSnapshot: { sessionsRevoked: existing.length },
  });
}

export async function revokeUserSession(sessionId: string, adminUserId: string) {
  const [existing] = await db
    .select({ userId: session.userId })
    .from(session)
    .where(eq(session.id, sessionId))
    .limit(1);

  await db.delete(session).where(eq(session.id, sessionId));

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: adminUserId,
    action: "revoke_user_session",
    entityType: "session",
    entityId: sessionId,
    organizationId: null,
    afterSnapshot: { targetUserId: existing?.userId ?? null },
  });
}

export async function deleteUser(userId: string, adminUserId: string) {
  const [existing] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  await db.delete(user).where(eq(user.id, userId));

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: adminUserId,
    action: "delete_user",
    entityType: "user",
    entityId: userId,
    organizationId: null,
    afterSnapshot: {
      email: existing?.email ?? null,
      name: existing?.name ?? null,
    },
  });
}

// ─── Bulk operations ─────────────────────────────────────────────────────────

export async function bulkRevokeUserSessions(
  userIds: string[],
  adminUserId: string,
): Promise<number> {
  if (userIds.length === 0) return 0;

  const existingSessions = await db
    .select({ userId: session.userId })
    .from(session)
    .where(inArray(session.userId, userIds));

  await db.delete(session).where(inArray(session.userId, userIds));

  await db.insert(platformAdminActions).values(
    userIds.map((userId) => ({
      id: sql`gen_random_uuid()`,
      platformAdminUserId: adminUserId,
      action: "revoke_all_user_sessions",
      entityType: "user",
      entityId: userId,
      organizationId: null,
      afterSnapshot: { bulk: true, sessionsRevoked: existingSessions.filter((s) => s.userId === userId).length },
    })),
  );

  return userIds.length;
}

export async function bulkDeleteUsers(
  userIds: string[],
  adminUserId: string,
): Promise<number> {
  if (userIds.length === 0) return 0;

  const existingUsers = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(inArray(user.id, userIds));

  await db.delete(user).where(inArray(user.id, userIds));

  await db.insert(platformAdminActions).values(
    existingUsers.map((u) => ({
      id: sql`gen_random_uuid()`,
      platformAdminUserId: adminUserId,
      action: "delete_user",
      entityType: "user",
      entityId: u.id,
      organizationId: null,
      afterSnapshot: { bulk: true, email: u.email, name: u.name },
    })),
  );

  return existingUsers.length;
}
