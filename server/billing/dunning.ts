import "server-only";

import { and, eq, inArray, isNotNull, lt, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import { invoices, organizations, organizationMemberships, roles } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { onInvoicePastDue } from "@/server/email/triggers";
import { logger } from "@/server/observability/logger";

/**
 * Reminder cadence in days past due. Indices map 1:1 to invoices.dunningStage:
 *   stage 0 = none sent
 *   stage 1 = day-1 reminder sent
 *   stage 2 = day-3 reminder sent
 *   stage 3 = day-7 reminder sent
 *   stage 4 = day-14 (final) reminder sent
 *
 * The cron computes the *target* stage from daysPastDue and walks the invoice
 * forward - so even if a cron run is missed, the next run sends the most
 * recent overdue stage rather than blasting all of them.
 */
export const DUNNING_DAYS = [1, 3, 7, 14] as const;
const MAX_STAGE = DUNNING_DAYS.length;

function targetStage(daysPastDue: number): number {
  let stage = 0;
  for (const day of DUNNING_DAYS) {
    if (daysPastDue >= day) stage++;
  }
  return stage;
}

export type DunningRunResult = {
  scanned: number;
  remindersSent: number;
  errors: number;
};

/**
 * Walk every overdue, unpaid invoice and send the next dunning reminder if
 * one is due. Idempotent: if the cron runs twice in a day it won't send
 * duplicate reminders because dunningStage advances on each send.
 */
export async function runDunningSweep(now: Date = new Date()): Promise<DunningRunResult> {
  const candidates = await db
    .select({
      id: invoices.id,
      organizationId: invoices.organizationId,
      number: invoices.number,
      amountDueCents: invoices.amountDueCents,
      currencyCode: invoices.currencyCode,
      invoiceUrl: invoices.invoiceUrl,
      dueAt: invoices.dueAt,
      dunningStage: invoices.dunningStage,
    })
    .from(invoices)
    .where(
      and(
        inArray(invoices.status, ["overdue", "sent"]),
        isNotNull(invoices.dueAt),
        lt(invoices.dunningStage, MAX_STAGE),
        or(eq(invoices.paidAt, null as unknown as Date), isNotNull(invoices.dueAt)),
      ),
    );

  let remindersSent = 0;
  let errors = 0;

  for (const inv of candidates) {
    if (!inv.dueAt) continue;
    if (inv.dueAt.getTime() > now.getTime()) continue; // not yet past due

    const daysPastDue = Math.max(1, Math.floor((now.getTime() - inv.dueAt.getTime()) / 86_400_000));
    const target = targetStage(daysPastDue);
    if (target <= inv.dunningStage) continue;

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

      if (!ownerRow?.ownerEmail) {
        // No owner to notify - still advance the stage so we don't keep
        // re-checking this invoice every day forever.
        await db
          .update(invoices)
          .set({ dunningStage: target, lastDunningAt: now, updatedAt: now })
          .where(eq(invoices.id, inv.id));
        continue;
      }

      const reminderDay = DUNNING_DAYS[target - 1];
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
        daysPastDue: reminderDay,
      });

      await db
        .update(invoices)
        .set({ dunningStage: target, lastDunningAt: now, updatedAt: now })
        .where(eq(invoices.id, inv.id));

      remindersSent++;
    } catch (err) {
      errors++;
      logger.error("billing.dunning.reminder_failed", err, {
        invoiceId: inv.id,
        targetStage: target,
      });
    }
  }

  return { scanned: candidates.length, remindersSent, errors };
}

/**
 * Reset dunning state when a payment lands. Called from the Stripe webhook
 * `invoice.paid` handler - keeps invoices that re-enter overdue (rare)
 * starting a fresh cadence rather than skipping all reminders.
 */
export async function resetDunningForInvoice(invoiceId: string): Promise<void> {
  await db
    .update(invoices)
    .set({ dunningStage: 0, lastDunningAt: null, updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));
}
