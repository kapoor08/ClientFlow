import "server-only";

import { count, desc, eq, gte, isNull, sql, sum } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  organizations,
  plans,
  subscriptions,
  organizationCurrentSubscriptions,
  clients,
  projects,
} from "@/db/schema";
import { user } from "@/db/auth-schema";

export async function getAdminDashboardStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalOrgs,
    totalUsers,
    activeSubscriptions,
    trialingSubscriptions,
    mrrResult,
    totalProjects,
    totalClients,
    newOrgsLast30Days,
    recentUsers,
    recentOrgs,
  ] = await Promise.all([
    db.select({ value: count(organizations.id) }).from(organizations).where(isNull(organizations.deletedAt)),

    db.select({ value: count(user.id) }).from(user),

    db
      .select({ value: count(subscriptions.id) })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),

    db
      .select({ value: count(subscriptions.id) })
      .from(subscriptions)
      .where(eq(subscriptions.status, "trialing")),

    db
      .select({ value: sum(plans.monthlyPriceCents) })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.status, "active")),

    db.select({ value: count(projects.id) }).from(projects).where(isNull(projects.deletedAt)),

    db.select({ value: count(clients.id) }).from(clients).where(isNull(clients.deletedAt)),

    db
      .select({
        date: sql<string>`date_trunc('day', ${organizations.createdAt})::date::text`,
        count: count(organizations.id),
      })
      .from(organizations)
      .where(gte(organizations.createdAt, thirtyDaysAgo))
      .groupBy(sql`date_trunc('day', ${organizations.createdAt})`)
      .orderBy(sql`date_trunc('day', ${organizations.createdAt})`),

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
      .limit(8),

    db
      .select({
        id: organizations.id,
        name: organizations.name,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(isNull(organizations.deletedAt))
      .orderBy(desc(organizations.createdAt))
      .limit(5),
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
    trialingSubscriptions: trialingSubscriptions[0]?.value ?? 0,
    mrrCents: Number(mrrResult[0]?.value ?? 0),
    totalProjects: totalProjects[0]?.value ?? 0,
    totalClients: totalClients[0]?.value ?? 0,
    growthData: newOrgsLast30Days,
    recentUsers,
    recentOrgs,
    planDistribution: planDist,
  };
}
