import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  organizations,
  organizationSettings,
  organizationMemberships,
  platformAdminActions,
  roles,
  plans,
  subscriptions,
  organizationCurrentSubscriptions,
  clients,
  projects,
} from "@/db/schema";
import { user, session } from "@/db/auth-schema";
import {
  buildPaginationMeta,
  paginationOffset,
  type PaginatedResult,
} from "@/utils/pagination";

export type AdminOrgRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  status: string;
  createdAt: Date;
  memberCount: number;
  projectCount: number;
  clientCount: number;
  planCode: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
};

type ListAdminOrgsOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
  status?: string;
  plan?: string;
};

const SORTABLE_COLUMNS = {
  name: organizations.name,
  createdAt: organizations.createdAt,
} as const;

export async function listAdminOrganizations(
  opts: ListAdminOrgsOptions = {},
): Promise<PaginatedResult<AdminOrgRow>> {
  const {
    query,
    page = 1,
    pageSize = 20,
    sort,
    order = "desc",
    status,
    plan,
  } = opts;

  // ── WHERE conditions ────────────────────────────────────────────────────────
  const conditions = [isNull(organizations.deletedAt)];

  if (query?.trim()) {
    const q = `%${query.trim()}%`;
    conditions.push(or(ilike(organizations.name, q), ilike(organizations.slug, q))!);
  }
  if (status) conditions.push(eq(organizations.status, status));

  const where = and(...conditions);

  // ── Count ───────────────────────────────────────────────────────────────────
  const [{ total }] = await db
    .select({ total: count(organizations.id) })
    .from(organizations)
    .where(where);

  const pagination = buildPaginationMeta(total, page, pageSize);

  // ── Sorted column ──────────────────────────────────────────────────────────
  const sortCol =
    SORTABLE_COLUMNS[sort as keyof typeof SORTABLE_COLUMNS] ??
    organizations.createdAt;
  const orderFn = order === "asc" ? asc : desc;

  // ── Fetch page ──────────────────────────────────────────────────────────────
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      isActive: organizations.isActive,
      status: organizations.status,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .where(where)
    .orderBy(orderFn(sortCol))
    .limit(pagination.pageSize)
    .offset(paginationOffset(pagination.page, pagination.pageSize));

  if (rows.length === 0) {
    return { data: [], pagination };
  }

  const orgIds = rows.map((r) => r.id);

  // ── Per-org supplemental data ───────────────────────────────────────────────
  const [memberCounts, projectCounts, clientCounts, subRows] = await Promise.all([
    db
      .select({
        organizationId: organizationMemberships.organizationId,
        count: count(organizationMemberships.id),
      })
      .from(organizationMemberships)
      .where(
        and(
          inArray(organizationMemberships.organizationId, orgIds),
          eq(organizationMemberships.status, "active"),
        ),
      )
      .groupBy(organizationMemberships.organizationId),

    db
      .select({
        organizationId: projects.organizationId,
        count: count(projects.id),
      })
      .from(projects)
      .where(and(inArray(projects.organizationId, orgIds), isNull(projects.deletedAt)))
      .groupBy(projects.organizationId),

    db
      .select({
        organizationId: clients.organizationId,
        count: count(clients.id),
      })
      .from(clients)
      .where(and(inArray(clients.organizationId, orgIds), isNull(clients.deletedAt)))
      .groupBy(clients.organizationId),

    db
      .select({
        organizationId: organizationCurrentSubscriptions.organizationId,
        planCode: plans.code,
        planName: plans.name,
        status: subscriptions.status,
      })
      .from(organizationCurrentSubscriptions)
      .innerJoin(subscriptions, eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(inArray(organizationCurrentSubscriptions.organizationId, orgIds)),
  ]);

  const memberMap = Object.fromEntries(memberCounts.map((r) => [r.organizationId, r.count]));
  const projectMap = Object.fromEntries(projectCounts.map((r) => [r.organizationId, r.count]));
  const clientMap = Object.fromEntries(clientCounts.map((r) => [r.organizationId, r.count]));
  const subMap = Object.fromEntries(subRows.map((r) => [r.organizationId, r]));

  let data: AdminOrgRow[] = rows.map((org) => ({
    ...org,
    memberCount: memberMap[org.id] ?? 0,
    projectCount: projectMap[org.id] ?? 0,
    clientCount: clientMap[org.id] ?? 0,
    planCode: subMap[org.id]?.planCode ?? null,
    planName: subMap[org.id]?.planName ?? null,
    subscriptionStatus: subMap[org.id]?.status ?? null,
  }));

  // Post-filter by plan (done in JS since plan comes from a joined table)
  if (plan) {
    data = data.filter((r) => r.planCode === plan);
  }

  return { data, pagination };
}

export async function getAdminOrgDetail(orgId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return null;

  const [settings, members, orgProjects, orgClients, subRow] = await Promise.all([
    db.select().from(organizationSettings).where(eq(organizationSettings.organizationId, orgId)).limit(1),

    db
      .select({
        id: organizationMemberships.id,
        userId: organizationMemberships.userId,
        status: organizationMemberships.status,
        joinedAt: organizationMemberships.joinedAt,
        roleName: roles.name,
        roleKey: roles.key,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(organizationMemberships)
      .innerJoin(roles, eq(organizationMemberships.roleId, roles.id))
      .innerJoin(user, eq(organizationMemberships.userId, user.id))
      .where(eq(organizationMemberships.organizationId, orgId))
      .orderBy(organizationMemberships.joinedAt),

    db
      .select({ id: projects.id, name: projects.name, status: projects.status, createdAt: projects.createdAt })
      .from(projects)
      .where(and(eq(projects.organizationId, orgId), isNull(projects.deletedAt)))
      .orderBy(desc(projects.createdAt)),

    db
      .select({ id: clients.id, name: clients.name, status: clients.status, createdAt: clients.createdAt })
      .from(clients)
      .where(and(eq(clients.organizationId, orgId), isNull(clients.deletedAt)))
      .orderBy(desc(clients.createdAt)),

    db
      .select({
        planCode: plans.code,
        planName: plans.name,
        status: subscriptions.status,
        billingCycle: subscriptions.billingCycle,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        monthlyPriceCents: plans.monthlyPriceCents,
        yearlyPriceCents: plans.yearlyPriceCents,
        stripeCustomerId: subscriptions.stripeCustomerId,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      })
      .from(organizationCurrentSubscriptions)
      .innerJoin(subscriptions, eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(organizationCurrentSubscriptions.organizationId, orgId))
      .limit(1),
  ]);

  return {
    org,
    settings: settings[0] ?? null,
    members,
    projects: orgProjects,
    clients: orgClients,
    subscription: subRow[0] ?? null,
  };
}

export async function suspendOrganization(
  orgId: string,
  reason: string,
  adminUserId: string,
) {
  const now = new Date();
  await db
    .update(organizations)
    .set({
      isActive: false,
      status: "suspended",
      suspendedAt: now,
      suspendedReason: reason,
      suspendedByAdminUserId: adminUserId,
      updatedAt: now,
    })
    .where(eq(organizations.id, orgId));

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: adminUserId,
    action: "suspend_organization",
    entityType: "organization",
    entityId: orgId,
    organizationId: orgId,
    afterSnapshot: { reason, suspendedAt: now.toISOString() },
  });
}

export async function restoreOrganization(orgId: string, adminUserId: string) {
  const now = new Date();
  await db
    .update(organizations)
    .set({
      isActive: true,
      status: "active",
      restoredAt: now,
      suspendedAt: null,
      suspendedReason: null,
      suspendedByAdminUserId: null,
      updatedAt: now,
    })
    .where(eq(organizations.id, orgId));

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: adminUserId,
    action: "restore_organization",
    entityType: "organization",
    entityId: orgId,
    organizationId: orgId,
    afterSnapshot: { restoredAt: now.toISOString() },
  });
}

export async function deleteOrganization(orgId: string, adminUserId: string) {
  const now = new Date();
  await db
    .update(organizations)
    .set({ deletedAt: now, status: "deleted", updatedAt: now })
    .where(eq(organizations.id, orgId));

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: adminUserId,
    action: "delete_organization",
    entityType: "organization",
    entityId: orgId,
    organizationId: orgId,
    afterSnapshot: { deletedAt: now.toISOString() },
  });
}

// ─── Bulk operations ─────────────────────────────────────────────────────────

export async function bulkSuspendOrganizations(
  orgIds: string[],
  reason: string,
  adminUserId: string,
): Promise<number> {
  if (orgIds.length === 0) return 0;
  const now = new Date();

  await db
    .update(organizations)
    .set({
      isActive: false,
      status: "suspended",
      suspendedAt: now,
      suspendedReason: reason,
      suspendedByAdminUserId: adminUserId,
      updatedAt: now,
    })
    .where(and(inArray(organizations.id, orgIds), isNull(organizations.deletedAt)));

  await db.insert(platformAdminActions).values(
    orgIds.map((orgId) => ({
      id: sql`gen_random_uuid()`,
      platformAdminUserId: adminUserId,
      action: "suspend_organization",
      entityType: "organization",
      entityId: orgId,
      organizationId: orgId,
      afterSnapshot: { reason, suspendedAt: now.toISOString(), bulk: true },
    })),
  );

  return orgIds.length;
}

export async function bulkRestoreOrganizations(
  orgIds: string[],
  adminUserId: string,
): Promise<number> {
  if (orgIds.length === 0) return 0;
  const now = new Date();

  await db
    .update(organizations)
    .set({
      isActive: true,
      status: "active",
      restoredAt: now,
      suspendedAt: null,
      suspendedReason: null,
      suspendedByAdminUserId: null,
      updatedAt: now,
    })
    .where(and(inArray(organizations.id, orgIds), isNull(organizations.deletedAt)));

  await db.insert(platformAdminActions).values(
    orgIds.map((orgId) => ({
      id: sql`gen_random_uuid()`,
      platformAdminUserId: adminUserId,
      action: "restore_organization",
      entityType: "organization",
      entityId: orgId,
      organizationId: orgId,
      afterSnapshot: { restoredAt: now.toISOString(), bulk: true },
    })),
  );

  return orgIds.length;
}

export async function forceLogoutAllOrgMembers(orgId: string, adminUserId: string) {
  const memberIds = await db
    .select({ userId: organizationMemberships.userId })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.organizationId, orgId),
        eq(organizationMemberships.status, "active"),
      ),
    );

  if (memberIds.length > 0) {
    const userIds = memberIds.map((m) => m.userId);
    await db.delete(session).where(inArray(session.userId, userIds));
  }

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: adminUserId,
    action: "force_logout_org_members",
    entityType: "organization",
    entityId: orgId,
    organizationId: orgId,
    afterSnapshot: { memberCount: memberIds.length },
  });
}
