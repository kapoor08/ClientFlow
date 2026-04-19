import { NextResponse } from "next/server";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  organizations,
  projects,
  clients,
  billingWebhookEvents,
  subscriptions,
  plans,
  organizationCurrentSubscriptions,
} from "@/db/schema";
import { session } from "@/db/auth-schema";
import { stripe, isStripeConfigured } from "@/server/third-party/stripe";
import { assertCronAuth } from "@/server/cron/guard";
import { logger } from "@/server/observability/logger";

/**
 * Nightly housekeeping — runs at 03:00 UTC.
 *
 * Each of the four sub-tasks is wrapped in its own try/catch so one failure
 * doesn't block the others.
 *
 * 1. Expired session cleanup
 * 2. Hard-delete soft-deleted rows past 90-day retention
 * 3. Billing webhook event cleanup (processed rows older than 90 days)
 * 4. Stripe reconciliation sweep for the last 24 hours
 */

const RETENTION_DAYS = 90;

export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  const now = new Date();
  const retentionCutoff = new Date(now.getTime() - RETENTION_DAYS * 86_400_000);
  const results: Record<string, number | string> = {};

  // ── 1. Expired session cleanup ─────────────────────────────────────────────
  try {
    const deleted = await db
      .delete(session)
      .where(lt(session.expiresAt, now))
      .returning({ id: session.id });
    results.sessionsDeleted = deleted.length;
  } catch (err) {
    logger.error("cron.housekeeping.sessions_failed", err);
    results.sessionsDeleted = "error";
  }

  // ── 2. Hard-delete soft-deleted rows past retention ────────────────────────
  try {
    const deletedProjects = await db
      .delete(projects)
      .where(and(isNotNull(projects.deletedAt), lt(projects.deletedAt, retentionCutoff)))
      .returning({ id: projects.id });

    const deletedClients = await db
      .delete(clients)
      .where(and(isNotNull(clients.deletedAt), lt(clients.deletedAt, retentionCutoff)))
      .returning({ id: clients.id });

    const deletedOrgs = await db
      .delete(organizations)
      .where(and(isNotNull(organizations.deletedAt), lt(organizations.deletedAt, retentionCutoff)))
      .returning({ id: organizations.id });

    results.projectsPurged = deletedProjects.length;
    results.clientsPurged = deletedClients.length;
    results.orgsPurged = deletedOrgs.length;
  } catch (err) {
    logger.error("cron.housekeeping.hard_delete_failed", err);
    results.projectsPurged = "error";
    results.clientsPurged = "error";
    results.orgsPurged = "error";
  }

  // ── 3. Webhook event cleanup ───────────────────────────────────────────────
  try {
    const deleted = await db
      .delete(billingWebhookEvents)
      .where(
        and(
          isNotNull(billingWebhookEvents.processedAt),
          lt(billingWebhookEvents.receivedAt, retentionCutoff),
        ),
      )
      .returning({ id: billingWebhookEvents.id });
    results.webhookEventsDeleted = deleted.length;
  } catch (err) {
    logger.error("cron.housekeeping.webhook_events_failed", err);
    results.webhookEventsDeleted = "error";
  }

  // ── 4. Stripe reconciliation (last 24h) ────────────────────────────────────
  if (!isStripeConfigured) {
    results.stripeReconciled = "skipped";
  } else {
    try {
      const since = Math.floor((now.getTime() - 86_400_000) / 1000);
      const list = await stripe.subscriptions.list({
        created: { gte: since },
        limit: 100,
      });

      let reconciled = 0;
      for (const stripeSub of list.data) {
        const [existing] = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id))
          .limit(1);

        if (existing) continue;

        const organizationId = stripeSub.metadata?.organizationId;
        const planCode = stripeSub.metadata?.planCode;
        if (!organizationId || !planCode) {
          logger.warn("cron.housekeeping.stripe_sub_missing_metadata", {
            stripeSubscriptionId: stripeSub.id,
          });
          continue;
        }

        const [plan] = await db
          .select({ id: plans.id })
          .from(plans)
          .where(eq(plans.code, planCode))
          .limit(1);

        if (!plan) {
          logger.warn("cron.housekeeping.stripe_sub_plan_not_found", {
            stripeSubscriptionId: stripeSub.id,
            planCode,
          });
          continue;
        }

        const subId = crypto.randomUUID();
        const stripeCustomerId =
          typeof stripeSub.customer === "string" ? stripeSub.customer : null;

        await db.insert(subscriptions).values({
          id: subId,
          organizationId,
          planId: plan.id,
          status: stripeSub.status,
          billingCycle: stripeSub.items.data[0]?.plan.interval ?? "month",
          startedAt: new Date(stripeSub.start_date * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          trialEndsAt: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
          stripeCustomerId,
          stripeSubscriptionId: stripeSub.id,
        });

        await db
          .insert(organizationCurrentSubscriptions)
          .values({
            id: crypto.randomUUID(),
            organizationId,
            subscriptionId: subId,
          })
          .onConflictDoUpdate({
            target: organizationCurrentSubscriptions.organizationId,
            set: { subscriptionId: subId, updatedAt: now },
          });

        reconciled++;
        logger.warn("cron.housekeeping.stripe_sub_reconciled", {
          stripeSubscriptionId: stripeSub.id,
          organizationId,
          planCode,
        });
      }
      results.stripeReconciled = reconciled;
    } catch (err) {
      logger.error("cron.housekeeping.stripe_failed", err);
      results.stripeReconciled = "error";
    }
  }

  logger.info("cron.housekeeping.done", results);
  return NextResponse.json({ ok: true, ...results });
}
