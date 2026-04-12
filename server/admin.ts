import "server-only";

import { and, count, desc, eq, gte, isNull, sql, sum } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  organizations,
  organizationSettings,
  organizationMemberships,
  organizationInvitations,
  roles,
  apiKeys,
  outboundWebhooks,
  auditLogs,
  plans,
  subscriptions,
  organizationCurrentSubscriptions,
  clients,
  projects,
} from "@/db/schema";
import { user, session } from "@/db/auth-schema";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getAdminDashboardStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalOrgs,
    totalUsers,
    activeSubscriptions,
    mrrResult,
    totalProjects,
    totalClients,
    newOrgsLast30Days,
    recentUsers,
  ] = await Promise.all([
    db.select({ value: count(organizations.id) }).from(organizations).where(isNull(organizations.deletedAt)),

    db.select({ value: count(user.id) }).from(user),

    db
      .select({ value: count(subscriptions.id) })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),

    db
      .select({ value: sum(plans.monthlyPriceCents) })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.status, "active")),

    db.select({ value: count(projects.id) }).from(projects).where(isNull(projects.deletedAt)),

    db.select({ value: count(clients.id) }).from(clients).where(isNull(clients.deletedAt)),

    // New orgs per day for last 30 days
    db
      .select({
        date: sql<string>`date_trunc('day', ${organizations.createdAt})::date::text`,
        count: count(organizations.id),
      })
      .from(organizations)
      .where(gte(organizations.createdAt, thirtyDaysAgo))
      .groupBy(sql`date_trunc('day', ${organizations.createdAt})`)
      .orderBy(sql`date_trunc('day', ${organizations.createdAt})`),

    // Recent signups (last 10)
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(10),

  ]);

  const planDist = await db
    .select({
      planCode: plans.code,
      planName: plans.name,
      count: count(organizationCurrentSubscriptions.organizationId),
    })
    .from(organizationCurrentSubscriptions)
    .innerJoin(subscriptions, eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id))
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .groupBy(plans.id, plans.code, plans.name);

  return {
    totalOrgs: totalOrgs[0]?.value ?? 0,
    totalUsers: totalUsers[0]?.value ?? 0,
    activeSubscriptions: activeSubscriptions[0]?.value ?? 0,
    mrrCents: Number(mrrResult[0]?.value ?? 0),
    totalProjects: totalProjects[0]?.value ?? 0,
    totalClients: totalClients[0]?.value ?? 0,
    growthData: newOrgsLast30Days,
    recentUsers,
    planDistribution: planDist,
  };
}

// ─── Organizations ────────────────────────────────────────────────────────────

export type AdminOrgRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  memberCount: number;
  projectCount: number;
  clientCount: number;
  planCode: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
};

export async function listAdminOrganizations(): Promise<AdminOrgRow[]> {
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      isActive: organizations.isActive,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .where(isNull(organizations.deletedAt))
    .orderBy(desc(organizations.createdAt));

  if (rows.length === 0) return [];

  const orgIds = rows.map((r) => r.id);

  const [memberCounts, projectCounts, clientCounts, subRows] = await Promise.all([
    db
      .select({
        organizationId: organizationMemberships.organizationId,
        count: count(organizationMemberships.id),
      })
      .from(organizationMemberships)
      .where(eq(organizationMemberships.status, "active"))
      .groupBy(organizationMemberships.organizationId),

    db
      .select({
        organizationId: projects.organizationId,
        count: count(projects.id),
      })
      .from(projects)
      .where(isNull(projects.deletedAt))
      .groupBy(projects.organizationId),

    db
      .select({
        organizationId: clients.organizationId,
        count: count(clients.id),
      })
      .from(clients)
      .where(isNull(clients.deletedAt))
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
      .innerJoin(plans, eq(subscriptions.planId, plans.id)),
  ]);

  const memberMap = Object.fromEntries(memberCounts.map((r) => [r.organizationId, r.count]));
  const projectMap = Object.fromEntries(projectCounts.map((r) => [r.organizationId, r.count]));
  const clientMap = Object.fromEntries(clientCounts.map((r) => [r.organizationId, r.count]));
  const subMap = Object.fromEntries(subRows.map((r) => [r.organizationId, r]));

  return rows.map((org) => ({
    ...org,
    memberCount: memberMap[org.id] ?? 0,
    projectCount: projectMap[org.id] ?? 0,
    clientCount: clientMap[org.id] ?? 0,
    planCode: subMap[org.id]?.planCode ?? null,
    planName: subMap[org.id]?.planName ?? null,
    subscriptionStatus: subMap[org.id]?.status ?? null,
  }));
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

export async function suspendOrganization(orgId: string) {
  await db
    .update(organizations)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));
}

export async function activateOrganization(orgId: string) {
  await db
    .update(organizations)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));
}

export async function deleteOrganization(orgId: string) {
  await db
    .update(organizations)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(organizations.id, orgId));
}

// ─── Users ────────────────────────────────────────────────────────────────────

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

export async function listAdminUsers(): Promise<AdminUserRow[]> {
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
    .orderBy(desc(user.createdAt));

  if (users.length === 0) return [];

  const orgCounts = await db
    .select({
      userId: organizationMemberships.userId,
      count: count(organizationMemberships.id),
    })
    .from(organizationMemberships)
    .groupBy(organizationMemberships.userId);

  const orgCountMap = Object.fromEntries(orgCounts.map((r) => [r.userId, r.count]));

  return users.map((u) => ({
    ...u,
    orgCount: orgCountMap[u.id] ?? 0,
  }));
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

export async function revokeAllUserSessions(userId: string) {
  await db.delete(session).where(eq(session.userId, userId));
}

export async function revokeUserSession(sessionId: string) {
  await db.delete(session).where(eq(session.id, sessionId));
}

export async function deleteUser(userId: string) {
  await db.delete(user).where(eq(user.id, userId));
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export async function getAdminBillingStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeRows, trialingRows, canceledThisMonth, allSubs] = await Promise.all([
    db.select({ value: count(subscriptions.id) }).from(subscriptions).where(eq(subscriptions.status, "active")),
    db.select({ value: count(subscriptions.id) }).from(subscriptions).where(eq(subscriptions.status, "trialing")),
    db
      .select({ value: count(subscriptions.id) })
      .from(subscriptions)
      .where(and(eq(subscriptions.status, "canceled"), gte(subscriptions.updatedAt, startOfMonth))),
    db
      .select({
        id: subscriptions.id,
        organizationId: organizationCurrentSubscriptions.organizationId,
        status: subscriptions.status,
        billingCycle: subscriptions.billingCycle,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        monthlyPriceCents: plans.monthlyPriceCents,
        yearlyPriceCents: plans.yearlyPriceCents,
        stripeCustomerId: subscriptions.stripeCustomerId,
        planCode: plans.code,
        planName: plans.name,
        orgName: organizations.name,
      })
      .from(organizationCurrentSubscriptions)
      .innerJoin(subscriptions, eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .innerJoin(organizations, eq(organizationCurrentSubscriptions.organizationId, organizations.id))
      .orderBy(desc(subscriptions.updatedAt)),
  ]);

  const mrrCents = allSubs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      if (s.billingCycle === "yearly") return sum + Math.round((s.yearlyPriceCents ?? 0) / 12);
      return sum + (s.monthlyPriceCents ?? 0);
    }, 0);

  return {
    activeCount: activeRows[0]?.value ?? 0,
    trialingCount: trialingRows[0]?.value ?? 0,
    canceledThisMonth: canceledThisMonth[0]?.value ?? 0,
    mrrCents,
    arrCents: mrrCents * 12,
    subscriptions: allSubs,
  };
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function listAdminAuditLogs(limit = 100) {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      ipAddress: auditLogs.ipAddress,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: user.name,
      actorEmail: user.email,
      orgName: organizations.name,
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorUserId, user.id))
    .leftJoin(organizations, eq(auditLogs.organizationId, organizations.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

// ─── Invitations ──────────────────────────────────────────────────────────────

export async function listAdminInvitations() {
  return db
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
    .orderBy(desc(organizationInvitations.createdAt));
}

export async function revokeInvitation(invitationId: string) {
  await db
    .update(organizationInvitations)
    .set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(organizationInvitations.id, invitationId));
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export async function listAdminApiKeys() {
  return db
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
    .orderBy(desc(apiKeys.createdAt));
}

export async function revokeApiKey(keyId: string) {
  await db.update(apiKeys).set({ revokedAt: new Date(), updatedAt: new Date() }).where(eq(apiKeys.id, keyId));
}

export async function deleteApiKey(keyId: string) {
  await db.delete(apiKeys).where(eq(apiKeys.id, keyId));
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export async function listAdminWebhooks() {
  return db
    .select({
      id: outboundWebhooks.id,
      name: outboundWebhooks.name,
      url: outboundWebhooks.url,
      events: outboundWebhooks.events,
      isActive: outboundWebhooks.isActive,
      lastTriggeredAt: outboundWebhooks.lastTriggeredAt,
      createdAt: outboundWebhooks.createdAt,
      orgName: organizations.name,
    })
    .from(outboundWebhooks)
    .innerJoin(organizations, eq(outboundWebhooks.organizationId, organizations.id))
    .orderBy(desc(outboundWebhooks.createdAt));
}

export async function deactivateWebhook(webhookId: string) {
  await db.update(outboundWebhooks).set({ isActive: false, updatedAt: new Date() }).where(eq(outboundWebhooks.id, webhookId));
}

export async function deleteWebhook(webhookId: string) {
  await db.delete(outboundWebhooks).where(eq(outboundWebhooks.id, webhookId));
}
