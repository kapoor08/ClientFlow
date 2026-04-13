import "server-only";

import { and, count, desc, eq, gte, isNull, sql, sum } from "drizzle-orm";
import { db } from "@/server/db/client";
import { analyticsDailyOrgMetrics, organizations, plans, subscriptions } from "@/db/schema";
import { user } from "@/db/auth-schema";

export async function getAdminAnalyticsData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [dailyMetrics, topOrgs] = await Promise.all([
    db
      .select({
        date: analyticsDailyOrgMetrics.metricDate,
        tasksCreated: sum(analyticsDailyOrgMetrics.tasksCreated),
        tasksCompleted: sum(analyticsDailyOrgMetrics.tasksCompleted),
        activeUsers: sum(analyticsDailyOrgMetrics.activeUsers),
      })
      .from(analyticsDailyOrgMetrics)
      .where(gte(analyticsDailyOrgMetrics.metricDate, thirtyDaysAgo))
      .groupBy(analyticsDailyOrgMetrics.metricDate)
      .orderBy(desc(analyticsDailyOrgMetrics.metricDate))
      .limit(30),

    db
      .select({
        id: organizations.id,
        name: organizations.name,
        createdAt: organizations.createdAt,
        totalTasksCreated: sum(analyticsDailyOrgMetrics.tasksCreated),
        totalActiveUsers: sum(analyticsDailyOrgMetrics.activeUsers),
      })
      .from(organizations)
      .leftJoin(analyticsDailyOrgMetrics, eq(analyticsDailyOrgMetrics.organizationId, organizations.id))
      .where(isNull(organizations.deletedAt))
      .groupBy(organizations.id, organizations.name, organizations.createdAt)
      .orderBy(desc(sum(analyticsDailyOrgMetrics.tasksCreated)))
      .limit(10),
  ]);

  return { dailyMetrics, topOrgs };
}

// ── Platform-level stats with period-over-period comparison ──────────────────

export async function getPlatformStats(days: number) {
  const now = new Date();
  const currentStart = new Date(now.getTime() - days * 86_400_000);
  const previousStart = new Date(currentStart.getTime() - days * 86_400_000);

  const n = (v: unknown) => Number(v ?? 0);

  const [orgRow, userRow, subRow] = await Promise.all([
    db
      .select({
        total: count(),
        newCurrent: sum(
          sql`CASE WHEN ${organizations.createdAt} >= ${currentStart} THEN 1 ELSE 0 END`,
        ),
        newPrevious: sum(
          sql`CASE WHEN ${organizations.createdAt} >= ${previousStart} AND ${organizations.createdAt} < ${currentStart} THEN 1 ELSE 0 END`,
        ),
      })
      .from(organizations)
      .where(isNull(organizations.deletedAt))
      .then((r) => r[0]),

    db
      .select({
        total: count(),
        newCurrent: sum(
          sql`CASE WHEN ${user.createdAt} >= ${currentStart} THEN 1 ELSE 0 END`,
        ),
        newPrevious: sum(
          sql`CASE WHEN ${user.createdAt} >= ${previousStart} AND ${user.createdAt} < ${currentStart} THEN 1 ELSE 0 END`,
        ),
      })
      .from(user)
      .then((r) => r[0]),

    db
      .select({
        activeCount: sum(
          sql`CASE WHEN ${subscriptions.status} IN ('active', 'trialing') THEN 1 ELSE 0 END`,
        ),
        newCurrent: sum(
          sql`CASE WHEN ${subscriptions.createdAt} >= ${currentStart} THEN 1 ELSE 0 END`,
        ),
        newPrevious: sum(
          sql`CASE WHEN ${subscriptions.createdAt} >= ${previousStart} AND ${subscriptions.createdAt} < ${currentStart} THEN 1 ELSE 0 END`,
        ),
        mrrCents: sum(
          sql`CASE
            WHEN ${subscriptions.status} = 'active' AND ${subscriptions.billingCycle} = 'yearly'
              THEN ROUND(COALESCE(${plans.yearlyPriceCents}, 0) / 12.0)
            WHEN ${subscriptions.status} = 'active'
              THEN COALESCE(${plans.monthlyPriceCents}, 0)
            ELSE 0
          END`,
        ),
      })
      .from(subscriptions)
      .leftJoin(plans, eq(subscriptions.planId, plans.id))
      .then((r) => r[0]),
  ]);

  return {
    orgs: {
      total: n(orgRow?.total),
      newCurrent: n(orgRow?.newCurrent),
      newPrevious: n(orgRow?.newPrevious),
    },
    users: {
      total: n(userRow?.total),
      newCurrent: n(userRow?.newCurrent),
      newPrevious: n(userRow?.newPrevious),
    },
    subscriptions: {
      active: n(subRow?.activeCount),
      newCurrent: n(subRow?.newCurrent),
      newPrevious: n(subRow?.newPrevious),
    },
    mrrCents: n(subRow?.mrrCents),
  };
}

export type PlatformStats = Awaited<ReturnType<typeof getPlatformStats>>;

// ── MRR trend - new MRR acquired per month ────────────────────────────────────

export async function getMrrTrend(months: number) {
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${subscriptions.createdAt}), 'YYYY-MM')`,
      mrrCents: sum(
        sql`CASE
          WHEN ${subscriptions.billingCycle} = 'yearly'
            THEN ROUND(COALESCE(${plans.yearlyPriceCents}, 0) / 12.0)
          ELSE COALESCE(${plans.monthlyPriceCents}, 0)
        END`,
      ),
    })
    .from(subscriptions)
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(gte(subscriptions.createdAt, start))
    .groupBy(sql`date_trunc('month', ${subscriptions.createdAt})`)
    .orderBy(sql`date_trunc('month', ${subscriptions.createdAt})`);

  return rows.map((r) => ({
    month: r.month,
    mrrCents: Number(r.mrrCents ?? 0),
  }));
}

export type MrrTrendRow = { month: string; mrrCents: number };

// ── Growth trend - new orgs + users per month ─────────────────────────────────

export async function getGrowthTrend(months: number) {
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const [orgRows, userRows] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${organizations.createdAt}), 'YYYY-MM')`,
        cnt: count(),
      })
      .from(organizations)
      .where(and(gte(organizations.createdAt, start), isNull(organizations.deletedAt)))
      .groupBy(sql`date_trunc('month', ${organizations.createdAt})`)
      .orderBy(sql`date_trunc('month', ${organizations.createdAt})`),

    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${user.createdAt}), 'YYYY-MM')`,
        cnt: count(),
      })
      .from(user)
      .where(gte(user.createdAt, start))
      .groupBy(sql`date_trunc('month', ${user.createdAt})`)
      .orderBy(sql`date_trunc('month', ${user.createdAt})`),
  ]);

  const map = new Map<string, { newOrgs: number; newUsers: number }>();

  for (const r of orgRows) {
    map.set(r.month, { newOrgs: Number(r.cnt), newUsers: 0 });
  }
  for (const r of userRows) {
    const prev = map.get(r.month) ?? { newOrgs: 0, newUsers: 0 };
    map.set(r.month, { ...prev, newUsers: Number(r.cnt) });
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));
}

export type GrowthTrendRow = { month: string; newOrgs: number; newUsers: number };

// ── Plan distribution - active subscriptions by plan ─────────────────────────

export async function getPlanDistribution() {
  const rows = await db
    .select({
      planCode: plans.code,
      planName: plans.name,
      cnt: count(),
    })
    .from(subscriptions)
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.status, "active"))
    .groupBy(plans.code, plans.name)
    .orderBy(desc(count()));

  return rows.map((r) => ({
    planCode: r.planCode ?? "unknown",
    planName: r.planName ?? "Unknown",
    count: Number(r.cnt),
  }));
}

export type PlanDistributionRow = { planCode: string; planName: string; count: number };
