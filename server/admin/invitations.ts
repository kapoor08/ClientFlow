import "server-only";

import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  organizations,
  organizationInvitations,
  roles,
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

export async function revokeInvitation(invitationId: string) {
  await db
    .update(organizationInvitations)
    .set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(organizationInvitations.id, invitationId));
}
