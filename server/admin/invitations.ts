import "server-only";

import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  organizations,
  organizationInvitations,
  roles,
  platformAdminActions,
} from "@/db/schema";
import { user } from "@/db/auth-schema";
import {
  buildPaginationMeta,
  paginationOffset,
  type PaginatedResult,
} from "@/utils/pagination";

export type AdminInvitationRow = {
  id: string;
  email: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  roleName: string;
  orgName: string;
  inviterName: string | null;
};

type ListAdminInvitationsOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
  status?: string;
};

export async function listAdminInvitations(
  opts: ListAdminInvitationsOptions = {},
): Promise<PaginatedResult<AdminInvitationRow>> {
  const { query, page = 1, pageSize = 20, status } = opts;

  // ── WHERE conditions ────────────────────────────────────────────────────────
  const conditions = [];

  if (query?.trim()) {
    const q = `%${query.trim()}%`;
    conditions.push(
      or(
        ilike(organizationInvitations.email, q),
        ilike(organizations.name, q),
      )!,
    );
  }
  if (status) conditions.push(eq(organizationInvitations.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // ── Count (must join orgs for org name search) ──────────────────────────────
  const [{ total }] = await db
    .select({ total: count(organizationInvitations.id) })
    .from(organizationInvitations)
    .innerJoin(organizations, eq(organizationInvitations.organizationId, organizations.id))
    .where(where);

  const pagination = buildPaginationMeta(total, page, pageSize);

  const rows = await db
    .select({
      id: organizationInvitations.id,
      email: organizationInvitations.email,
      status: organizationInvitations.status,
      expiresAt: organizationInvitations.expiresAt,
      createdAt: organizationInvitations.createdAt,
      roleName: roles.name,
      orgName: organizations.name,
      inviterName: user.name,
    })
    .from(organizationInvitations)
    .innerJoin(organizations, eq(organizationInvitations.organizationId, organizations.id))
    .innerJoin(roles, eq(organizationInvitations.roleId, roles.id))
    .leftJoin(user, eq(organizationInvitations.invitedByUserId, user.id))
    .where(where)
    .orderBy(desc(organizationInvitations.createdAt))
    .limit(pagination.pageSize)
    .offset(paginationOffset(pagination.page, pagination.pageSize));

  return { data: rows, pagination };
}

export async function revokeInvitation(invitationId: string, adminUserId: string) {
  const [meta] = await db
    .select({
      organizationId: organizationInvitations.organizationId,
      email: organizationInvitations.email,
    })
    .from(organizationInvitations)
    .where(eq(organizationInvitations.id, invitationId))
    .limit(1);

  await db
    .update(organizationInvitations)
    .set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(organizationInvitations.id, invitationId));

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: adminUserId,
    action: "revoke_invitation",
    entityType: "invitation",
    entityId: invitationId,
    organizationId: meta?.organizationId ?? null,
    afterSnapshot: { email: meta?.email ?? null },
  });
}

// ─── Bulk operations ─────────────────────────────────────────────────────────

export async function bulkRevokeInvitations(
  invitationIds: string[],
  adminUserId: string,
): Promise<number> {
  if (invitationIds.length === 0) return 0;

  // Only revoke pending invitations — skip accepted/expired/already-revoked
  const eligible = await db
    .select({
      id: organizationInvitations.id,
      organizationId: organizationInvitations.organizationId,
      email: organizationInvitations.email,
    })
    .from(organizationInvitations)
    .where(
      and(
        inArray(organizationInvitations.id, invitationIds),
        eq(organizationInvitations.status, "pending"),
      ),
    );

  if (eligible.length === 0) return 0;

  const now = new Date();
  await db
    .update(organizationInvitations)
    .set({ status: "revoked", revokedAt: now, updatedAt: now })
    .where(inArray(organizationInvitations.id, eligible.map((r) => r.id)));

  await db.insert(platformAdminActions).values(
    eligible.map((r) => ({
      id: sql`gen_random_uuid()`,
      platformAdminUserId: adminUserId,
      action: "revoke_invitation",
      entityType: "invitation",
      entityId: r.id,
      organizationId: r.organizationId,
      afterSnapshot: { email: r.email, bulk: true },
    })),
  );

  return eligible.length;
}
