import { and, eq, lt } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  subscriptions,
  organizationInvitations,
  invoices,
  organizations,
  organizationMemberships,
  roles,
} from "@/db/schema";
import { user } from "@/db/auth-schema";
import { assertCronAuth, runCron } from "@/server/cron/guard";
import { logger } from "@/server/observability/logger";
import { onSubscriptionChanged } from "@/server/email/triggers";
import { runDunningSweep } from "@/server/billing/dunning";

/**
 * Daily expiration sweep - runs at 02:00 UTC.
 *
 * 1. Trial expiration - subscriptions in `trialing` past `trialEndsAt`
 * 2. Invitation expiration - pending invitations past `expiresAt`
 * 3. Invoice past-due marking - sent invoices past `dueAt`
 *
 * Each step is independent; one failing does not block the others.
 */
export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  return runCron("daily-expirations", async () => {
    const now = new Date();
    const results: Record<string, number | string> = {};

    // ── 1. Trial expiration ────────────────────────────────────────────────────
    try {
      const expiredTrials = await db
        .select({
          id: subscriptions.id,
          organizationId: subscriptions.organizationId,
          planId: subscriptions.planId,
        })
        .from(subscriptions)
        .where(and(eq(subscriptions.status, "trialing"), lt(subscriptions.trialEndsAt, now)));

      if (expiredTrials.length > 0) {
        await db
          .update(subscriptions)
          .set({ status: "canceled", canceledAt: now, endedAt: now, updatedAt: now })
          .where(and(eq(subscriptions.status, "trialing"), lt(subscriptions.trialEndsAt, now)));

        // Fire cancellation emails per expired trial. Awaited so errors surface.
        for (const sub of expiredTrials) {
          try {
            const [ownerRow] = await db
              .select({
                orgName: organizations.name,
                ownerName: user.name,
                ownerEmail: user.email,
              })
              .from(organizationMemberships)
              .innerJoin(user, eq(organizationMemberships.userId, user.id))
              .innerJoin(
                organizations,
                eq(organizationMemberships.organizationId, organizations.id),
              )
              .innerJoin(roles, eq(organizationMemberships.roleId, roles.id))
              .where(
                and(
                  eq(organizationMemberships.organizationId, sub.organizationId),
                  eq(roles.key, "owner"),
                ),
              )
              .limit(1);

            if (ownerRow?.ownerEmail) {
              await onSubscriptionChanged({
                owner: { id: "", name: ownerRow.ownerName ?? "Owner", email: ownerRow.ownerEmail },
                org: { id: sub.organizationId, name: ownerRow.orgName },
                changeType: "cancelled",
                oldPlan: "Trial",
                newPlan: "Trial (expired)",
                billingUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/settings/billing`,
              });
            }
          } catch (err) {
            logger.error("cron.daily_expirations.trial_email_failed", err, {
              subscriptionId: sub.id,
            });
          }
        }
      }

      results.trialsExpired = expiredTrials.length;
    } catch (err) {
      logger.error("cron.daily_expirations.trials_failed", err);
      results.trialsExpired = "error";
    }

    // ── 2. Invitation expiration ───────────────────────────────────────────────
    try {
      const updated = await db
        .update(organizationInvitations)
        .set({ status: "expired", updatedAt: now })
        .where(
          and(
            eq(organizationInvitations.status, "pending"),
            lt(organizationInvitations.expiresAt, now),
          ),
        )
        .returning({ id: organizationInvitations.id });
      results.invitationsExpired = updated.length;
    } catch (err) {
      logger.error("cron.daily_expirations.invitations_failed", err);
      results.invitationsExpired = "error";
    }

    // ── 3. Invoice past-due marking ────────────────────────────────────────────
    // Flip sent → overdue when the due date has passed; the dunning sweep
    // (next step) handles the email cadence based on days-past-due.
    try {
      const flipped = await db
        .update(invoices)
        .set({ status: "overdue", updatedAt: now })
        .where(and(eq(invoices.status, "sent"), lt(invoices.dueAt, now)))
        .returning({ id: invoices.id });
      results.invoicesMarkedOverdue = flipped.length;
    } catch (err) {
      logger.error("cron.daily_expirations.invoices_failed", err);
      results.invoicesMarkedOverdue = "error";
    }

    // ── 4. Dunning sweep (day 1 / 3 / 7 / 14 reminders) ────────────────────────
    try {
      const dunning = await runDunningSweep(now);
      results.dunningScanned = dunning.scanned;
      results.dunningRemindersSent = dunning.remindersSent;
      if (dunning.errors > 0) results.dunningErrors = dunning.errors;
    } catch (err) {
      logger.error("cron.daily_expirations.dunning_failed", err);
      results.dunningRemindersSent = "error";
    }

    logger.info("cron.daily_expirations.done", results);
    return results;
  });
}
