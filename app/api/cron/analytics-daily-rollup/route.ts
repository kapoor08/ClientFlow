import { NextResponse } from "next/server";
import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  organizations,
  projects,
  tasks,
  invoices,
  subscriptions,
  analyticsDailyOrgMetrics,
  platformAnalyticsDailyMetrics,
} from "@/db/schema";
import { user, session } from "@/db/auth-schema";
import { assertCronAuth } from "@/server/cron/guard";
import { logger } from "@/server/observability/logger";

/**
 * Daily analytics rollup - runs at 00:30 UTC.
 *
 * Captures yesterday's metrics for every active org (`analytics_daily_org_metrics`)
 * and one platform-wide row (`platform_analytics_daily_metrics`). Idempotent
 * via ON CONFLICT on the unique (orgId, metricDate) and metricDate keys.
 */
export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  const now = new Date();
  const yStart = new Date(now);
  yStart.setUTCDate(yStart.getUTCDate() - 1);
  yStart.setUTCHours(0, 0, 0, 0);
  const yEnd = new Date(yStart);
  yEnd.setUTCDate(yEnd.getUTCDate() + 1);

  const results: Record<string, number | string> = {};

  // ── Per-org rollup ─────────────────────────────────────────────────────────
  try {
    const orgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(isNull(organizations.deletedAt));

    let rolled = 0;
    for (const org of orgs) {
      const [projectsAgg] = await db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where ${projects.status} not in ('completed', 'cancelled'))::int`,
        })
        .from(projects)
        .where(and(eq(projects.organizationId, org.id), isNull(projects.deletedAt)));

      const [tasksAgg] = await db
        .select({
          created: sql<number>`count(*) filter (where ${tasks.createdAt} >= ${yStart} and ${tasks.createdAt} < ${yEnd})::int`,
          completed: sql<number>`count(*) filter (where ${tasks.completedAt} >= ${yStart} and ${tasks.completedAt} < ${yEnd})::int`,
        })
        .from(tasks)
        .where(and(eq(tasks.organizationId, org.id), isNull(tasks.deletedAt)));

      const [revenueAgg] = await db
        .select({
          cents: sql<number>`coalesce(sum(${invoices.amountPaidCents}), 0)::int`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.organizationId, org.id),
            eq(invoices.status, "paid"),
            gte(invoices.paidAt, yStart),
            lt(invoices.paidAt, yEnd),
          ),
        );

      const [activeUsers] = await db
        .select({
          count: sql<number>`count(distinct ${tasks.reporterUserId})::int`,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.organizationId, org.id),
            gte(tasks.updatedAt, yStart),
            lt(tasks.updatedAt, yEnd),
          ),
        );

      await db
        .insert(analyticsDailyOrgMetrics)
        .values({
          id: crypto.randomUUID(),
          organizationId: org.id,
          metricDate: yStart,
          projectsTotal: projectsAgg?.total ?? 0,
          projectsActive: projectsAgg?.active ?? 0,
          tasksCreated: tasksAgg?.created ?? 0,
          tasksCompleted: tasksAgg?.completed ?? 0,
          activeUsers: activeUsers?.count ?? 0,
          revenueCents: revenueAgg?.cents ?? 0,
        })
        .onConflictDoUpdate({
          target: [analyticsDailyOrgMetrics.organizationId, analyticsDailyOrgMetrics.metricDate],
          set: {
            projectsTotal: projectsAgg?.total ?? 0,
            projectsActive: projectsAgg?.active ?? 0,
            tasksCreated: tasksAgg?.created ?? 0,
            tasksCompleted: tasksAgg?.completed ?? 0,
            activeUsers: activeUsers?.count ?? 0,
            revenueCents: revenueAgg?.cents ?? 0,
            updatedAt: now,
          },
        });
      rolled++;
    }
    results.orgsRolledUp = rolled;
  } catch (err) {
    logger.error("cron.analytics_daily.org_rollup_failed", err);
    results.orgsRolledUp = "error";
  }

  // ── Platform-wide rollup ───────────────────────────────────────────────────
  try {
    const [signups] = await db
      .select({
        count: sql<number>`count(*) filter (where ${user.createdAt} >= ${yStart} and ${user.createdAt} < ${yEnd})::int`,
      })
      .from(user);

    const [activeOrgs] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(organizations)
      .where(and(eq(organizations.isActive, true), isNull(organizations.deletedAt)));

    const [dau] = await db
      .select({
        count: sql<number>`count(distinct ${session.userId})::int`,
      })
      .from(session)
      .where(and(gte(session.createdAt, yStart), lt(session.createdAt, yEnd)));

    const mauStart = new Date(yStart);
    mauStart.setUTCDate(mauStart.getUTCDate() - 30);
    const [mau] = await db
      .select({
        count: sql<number>`count(distinct ${session.userId})::int`,
      })
      .from(session)
      .where(and(gte(session.createdAt, mauStart), lt(session.createdAt, yEnd)));

    const [newSubs] = await db
      .select({
        count: sql<number>`count(*) filter (where ${subscriptions.startedAt} >= ${yStart} and ${subscriptions.startedAt} < ${yEnd})::int`,
      })
      .from(subscriptions);

    const [canceledSubs] = await db
      .select({
        count: sql<number>`count(*) filter (where ${subscriptions.canceledAt} >= ${yStart} and ${subscriptions.canceledAt} < ${yEnd})::int`,
      })
      .from(subscriptions);

    await db
      .insert(platformAnalyticsDailyMetrics)
      .values({
        id: crypto.randomUUID(),
        metricDate: yStart,
        newSignups: signups?.count ?? 0,
        activeOrgs: activeOrgs?.count ?? 0,
        dau: dau?.count ?? 0,
        mau: mau?.count ?? 0,
        newSubscriptions: newSubs?.count ?? 0,
        canceledSubscriptions: canceledSubs?.count ?? 0,
      })
      .onConflictDoUpdate({
        target: platformAnalyticsDailyMetrics.metricDate,
        set: {
          newSignups: signups?.count ?? 0,
          activeOrgs: activeOrgs?.count ?? 0,
          dau: dau?.count ?? 0,
          mau: mau?.count ?? 0,
          newSubscriptions: newSubs?.count ?? 0,
          canceledSubscriptions: canceledSubs?.count ?? 0,
          updatedAt: now,
        },
      });

    results.platformRolledUp = 1;
  } catch (err) {
    logger.error("cron.analytics_daily.platform_rollup_failed", err);
    results.platformRolledUp = "error";
  }

  logger.info("cron.analytics_daily.done", { ...results, metricDate: yStart.toISOString() });
  return NextResponse.json({ ok: true, metricDate: yStart.toISOString(), ...results });
}
