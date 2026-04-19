import { NextResponse } from "next/server";
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
import { assertCronAuth } from "@/server/cron/guard";
import { logger } from "@/server/observability/logger";
import { onSubscriptionChanged, onInvoicePastDue } from "@/server/email/triggers";

/**
 * Daily expiration sweep — runs at 02:00 UTC.
 *
 * 1. Trial expiration — subscriptions in `trialing` past `trialEndsAt`
 * 2. Invitation expiration — pending invitations past `expiresAt`
 * 3. Invoice past-due marking — sent invoices past `dueAt`
 *
 * Each step is independent; one failing does not block the others.
 */
export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

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
      .where(
        and(
          eq(subscriptions.status, "trialing"),
          lt(subscriptions.trialEndsAt, now),
        ),
      );

    if (expiredTrials.length > 0) {
      await db
        .update(subscriptions)
        .set({ status: "canceled", canceledAt: now, endedAt: now, updatedAt: now })
        .where(
          and(
            eq(subscriptions.status, "trialing"),
            lt(subscriptions.trialEndsAt, now),
          ),
        );

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
            .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
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
  try {
    const overdue = await db
      .select({
        id: invoices.id,
        organizationId: invoices.organizationId,
        number: invoices.number,
        amountDueCents: invoices.amountDueCents,
        currencyCode: invoices.currencyCode,
        invoiceUrl: invoices.invoiceUrl,
        dueAt: invoices.dueAt,
      })
      .from(invoices)
      .where(and(eq(invoices.status, "sent"), lt(invoices.dueAt, now)));

    if (overdue.length > 0) {
      await db
        .update(invoices)
        .set({ status: "overdue", updatedAt: now })
        .where(and(eq(invoices.status, "sent"), lt(invoices.dueAt, now)));

      for (const inv of overdue) {
        try {
          const [ownerRow] = await db
            .select({
              orgName: organizations.name,
              ownerName: user.name,
              ownerEmail: user.email,
            })
            .from(organizationMemberships)
            .innerJoin(user, eq(organizationMemberships.userId, user.id))
            .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
            .innerJoin(roles, eq(organizationMemberships.roleId, roles.id))
            .where(
              and(
                eq(organizationMemberships.organizationId, inv.organizationId),
                eq(roles.key, "owner"),
              ),
            )
            .limit(1);

          if (ownerRow?.ownerEmail && inv.dueAt) {
            const daysPastDue = Math.max(
              1,
              Math.floor((now.getTime() - inv.dueAt.getTime()) / 86_400_000),
            );
            const amountFormatted = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: (inv.currencyCode ?? "USD").toUpperCase(),
            }).format((inv.amountDueCents ?? 0) / 100);

            await onInvoicePastDue({
              owner: { id: "", name: ownerRow.ownerName ?? "Owner", email: ownerRow.ownerEmail },
              org: { id: inv.organizationId, name: ownerRow.orgName },
              invoice: {
                number: inv.number ?? inv.id.slice(0, 8),
                amountDue: amountFormatted,
                dueDate: inv.dueAt.toLocaleDateString("en-US"),
              },
              invoiceUrl: inv.invoiceUrl ?? "",
              daysPastDue,
            });
          }
        } catch (err) {
          logger.error("cron.daily_expirations.invoice_email_failed", err, {
            invoiceId: inv.id,
          });
        }
      }
    }

    results.invoicesMarkedOverdue = overdue.length;
  } catch (err) {
    logger.error("cron.daily_expirations.invoices_failed", err);
    results.invoicesMarkedOverdue = "error";
  }

  logger.info("cron.daily_expirations.done", results);
  return NextResponse.json({ ok: true, ...results });
}
