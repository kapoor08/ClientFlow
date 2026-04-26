import { NextResponse } from "next/server";
import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  organizations,
  usageCounters,
  analyticsDailyOrgMetrics,
  analyticsMonthlyOrgMetrics,
  platformAnalyticsDailyMetrics,
  platformAnalyticsMonthlyMetrics,
  subscriptions,
  plans,
} from "@/db/schema";
import { assertCronAuth } from "@/server/cron/guard";
import { logger } from "@/server/observability/logger";

const METERED_FEATURES = [
  "tasks_per_month",
  "comments_per_month",
  "file_uploads_per_month",
] as const;

/**
 * Monthly rollover - runs on the 1st of each month at 00:15 UTC.
 *
 * 1. Usage counter rollover: open fresh rows for every active org × metered
 *    feature for the new month. Previous month's rows stay in place as a
 *    historical record.
 * 2. Monthly analytics rollup: aggregate last month's daily metrics into
 *    `analytics_monthly_org_metrics` and `platform_analytics_monthly_metrics`.
 */
export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const results: Record<string, number | string> = {};

  // ── 1. Usage counter rollover ──────────────────────────────────────────────
  try {
    const orgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(and(eq(organizations.isActive, true), isNull(organizations.deletedAt)));

    let rows = 0;
    for (const org of orgs) {
      for (const featureKey of METERED_FEATURES) {
        await db.insert(usageCounters).values({
          id: crypto.randomUUID(),
          organizationId: org.id,
          featureKey,
          periodStart: thisMonthStart,
          periodEnd: nextMonthStart,
          usedValue: 0,
        });
        rows++;
      }
    }
    results.usageCountersOpened = rows;
  } catch (err) {
    logger.error("cron.monthly_rollover.usage_failed", err);
    results.usageCountersOpened = "error";
  }

  // ── 2. Per-org monthly analytics rollup ───────────────────────────────────
  try {
    const orgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(isNull(organizations.deletedAt));

    let rolled = 0;
    for (const org of orgs) {
      // Aggregate last month's daily rows for this org
      const [agg] = await db
        .select({
          tasksCompleted: sql<number>`coalesce(sum(${analyticsDailyOrgMetrics.tasksCompleted}), 0)::int`,
          tasksCreated: sql<number>`coalesce(sum(${analyticsDailyOrgMetrics.tasksCreated}), 0)::int`,
          mrrCents: sql<number>`coalesce(sum(${analyticsDailyOrgMetrics.revenueCents}), 0)::int`,
        })
        .from(analyticsDailyOrgMetrics)
        .where(
          and(
            eq(analyticsDailyOrgMetrics.organizationId, org.id),
            gte(analyticsDailyOrgMetrics.metricDate, lastMonthStart),
            lt(analyticsDailyOrgMetrics.metricDate, thisMonthStart),
          ),
        );

      const completionRate =
        agg && agg.tasksCreated > 0 ? (agg.tasksCompleted / agg.tasksCreated).toFixed(4) : "0";

      await db
        .insert(analyticsMonthlyOrgMetrics)
        .values({
          id: crypto.randomUUID(),
          organizationId: org.id,
          metricMonth: lastMonthStart,
          newClients: 0, // placeholder - can be filled in by a future enrichment job
          retainedClients: 0,
          taskCompletionRate: completionRate,
          mrrCents: agg?.mrrCents ?? 0,
          churnRate: "0",
        })
        .onConflictDoUpdate({
          target: [
            analyticsMonthlyOrgMetrics.organizationId,
            analyticsMonthlyOrgMetrics.metricMonth,
          ],
          set: {
            taskCompletionRate: completionRate,
            mrrCents: agg?.mrrCents ?? 0,
            updatedAt: now,
          },
        });
      rolled++;
    }
    results.orgMonthlyRolledUp = rolled;
  } catch (err) {
    logger.error("cron.monthly_rollover.org_monthly_failed", err);
    results.orgMonthlyRolledUp = "error";
  }

  // ── 3. Platform monthly rollup ─────────────────────────────────────────────
  try {
    const [platformAgg] = await db
      .select({
        newSignups: sql<number>`coalesce(sum(${platformAnalyticsDailyMetrics.newSignups}), 0)::int`,
        newSubs: sql<number>`coalesce(sum(${platformAnalyticsDailyMetrics.newSubscriptions}), 0)::int`,
        canceledSubs: sql<number>`coalesce(sum(${platformAnalyticsDailyMetrics.canceledSubscriptions}), 0)::int`,
      })
      .from(platformAnalyticsDailyMetrics)
      .where(
        and(
          gte(platformAnalyticsDailyMetrics.metricDate, lastMonthStart),
          lt(platformAnalyticsDailyMetrics.metricDate, thisMonthStart),
        ),
      );

    // Current MRR / ARR from live subscriptions
    const activeSubs = await db
      .select({
        billingCycle: subscriptions.billingCycle,
        monthlyPriceCents: plans.monthlyPriceCents,
        yearlyPriceCents: plans.yearlyPriceCents,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.status, "active"));

    const mrrCents = activeSubs.reduce((sum, s) => {
      if (s.billingCycle === "yearly") return sum + Math.round((s.yearlyPriceCents ?? 0) / 12);
      return sum + (s.monthlyPriceCents ?? 0);
    }, 0);

    const totalSubsLast = (platformAgg?.newSubs ?? 0) + (platformAgg?.canceledSubs ?? 0);
    const churnRate =
      totalSubsLast > 0 ? ((platformAgg?.canceledSubs ?? 0) / totalSubsLast).toFixed(4) : "0";
    const conversionRate =
      (platformAgg?.newSignups ?? 0) > 0
        ? ((platformAgg?.newSubs ?? 0) / (platformAgg?.newSignups ?? 0)).toFixed(4)
        : "0";

    await db
      .insert(platformAnalyticsMonthlyMetrics)
      .values({
        id: crypto.randomUUID(),
        metricMonth: lastMonthStart,
        mrrCents,
        arrCents: mrrCents * 12,
        newOrgs: 0, // could be filled via organizations.createdAt range query later
        churnedOrgs: 0,
        churnRate,
        trialConversionRate: conversionRate,
      })
      .onConflictDoUpdate({
        target: platformAnalyticsMonthlyMetrics.metricMonth,
        set: {
          mrrCents,
          arrCents: mrrCents * 12,
          churnRate,
          trialConversionRate: conversionRate,
          updatedAt: now,
        },
      });

    results.platformMonthlyRolledUp = 1;
  } catch (err) {
    logger.error("cron.monthly_rollover.platform_failed", err);
    results.platformMonthlyRolledUp = "error";
  }

  logger.info("cron.monthly_rollover.done", {
    ...results,
    period: lastMonthStart.toISOString(),
  });
  return NextResponse.json({ ok: true, period: lastMonthStart.toISOString(), ...results });
}
