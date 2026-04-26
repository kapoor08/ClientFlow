import { NextResponse } from "next/server";
import { and, eq, isNotNull, isNull, lt, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import { subscriptions, organizations, organizationMemberships, roles } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { stripe, isStripeConfigured } from "@/server/third-party/stripe";
import { assertCronAuth } from "@/server/cron/guard";
import { logger } from "@/server/observability/logger";
import { onPaymentMethodExpiring } from "@/server/email/triggers";

/**
 * Weekly payment-method reminders - runs Mondays 09:00 UTC.
 *
 * For every active subscription with a Stripe customer ID, fetches the
 * default payment method and, if it expires within the next 14 days and
 * we haven't already notified within the last 60 days, sends the
 * onPaymentMethodExpiring email.
 *
 * Processes in batches of 10 to stay friendly with Stripe rate limits.
 */
export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  if (!isStripeConfigured) {
    logger.warn("cron.payment_method_reminders.stripe_not_configured");
    return NextResponse.json({ ok: true, skipped: "stripe_not_configured" });
  }

  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  let processed = 0;
  let notified = 0;
  let errors = 0;

  try {
    const candidates = await db
      .select({
        subscriptionId: subscriptions.id,
        organizationId: subscriptions.organizationId,
        stripeCustomerId: subscriptions.stripeCustomerId,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "active"),
          isNotNull(subscriptions.stripeCustomerId),
          or(
            isNull(subscriptions.paymentMethodExpiryNotifiedAt),
            lt(subscriptions.paymentMethodExpiryNotifiedAt, sixtyDaysAgo),
          ),
        ),
      );

    // Process in batches of 10 so we don't flood Stripe
    const BATCH = 10;
    for (let i = 0; i < candidates.length; i += BATCH) {
      const batch = candidates.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (sub) => {
          if (!sub.stripeCustomerId) return;
          processed++;
          try {
            const customer = await stripe.customers.retrieve(sub.stripeCustomerId, {
              expand: ["invoice_settings.default_payment_method"],
            });

            if (customer.deleted) return;
            const defaultMethod = (
              customer.invoice_settings as unknown as {
                default_payment_method?: {
                  card?: { brand?: string; last4?: string; exp_month?: number; exp_year?: number };
                };
              }
            )?.default_payment_method;
            const card = defaultMethod?.card;
            if (!card?.exp_month || !card?.exp_year) return;

            // Expires within 14 days?
            const expiryDate = new Date(Date.UTC(card.exp_year, card.exp_month, 0));
            const diffDays = (expiryDate.getTime() - now.getTime()) / 86_400_000;
            if (diffDays > 14 || diffDays < 0) return;

            // Resolve org owner
            const [ownerRow] = await db
              .select({
                orgName: organizations.name,
                ownerName: user.name,
                ownerEmail: user.email,
                ownerId: user.id,
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

            if (!ownerRow?.ownerEmail) return;

            await onPaymentMethodExpiring({
              owner: {
                id: ownerRow.ownerId,
                name: ownerRow.ownerName ?? "Owner",
                email: ownerRow.ownerEmail,
              },
              org: { id: sub.organizationId, name: ownerRow.orgName },
              card: {
                brand: card.brand ?? "card",
                last4: card.last4 ?? "••••",
                expMonth: String(card.exp_month).padStart(2, "0"),
                expYear: String(card.exp_year),
              },
              updateUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/settings/billing`,
            });

            await db
              .update(subscriptions)
              .set({ paymentMethodExpiryNotifiedAt: now, updatedAt: now })
              .where(eq(subscriptions.id, sub.subscriptionId));

            notified++;
          } catch (err) {
            errors++;
            logger.error("cron.payment_method_reminders.per_sub_failed", err, {
              subscriptionId: sub.subscriptionId,
            });
          }
        }),
      );
    }
  } catch (err) {
    logger.error("cron.payment_method_reminders.failed", err);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }

  logger.info("cron.payment_method_reminders.done", { processed, notified, errors });
  return NextResponse.json({ ok: true, processed, notified, errors });
}
