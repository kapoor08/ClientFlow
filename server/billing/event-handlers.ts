import "server-only";

import type Stripe from "stripe";
import { and, count, eq, or } from "drizzle-orm";
import { stripe, withStripeBreaker } from "@/server/third-party/stripe";
import { db } from "@/server/db/client";
import {
  plans,
  subscriptions,
  organizationCurrentSubscriptions,
  organizations,
  organizationMemberships,
  roles,
  invoices,
} from "@/db/schema";
import { user } from "@/db/auth-schema";
import {
  onPaymentFailed,
  onInvoiceAvailable,
  onSubscriptionChanged,
} from "@/server/email/triggers";
import { dispatchWebhookEvent } from "@/server/webhooks/dispatch";
import {
  getSubscriptionPeriod,
  getSubscriptionIdFromInvoice,
  resolveSubscriptionChangeType,
} from "@/server/billing/webhook-helpers";
import { logger } from "@/server/observability/logger";
import { captureServerEvent, orgDistinctId } from "@/lib/analytics/server";
import { FUNNEL_EVENTS } from "@/lib/analytics/events";
import {
  calculateGstFromGross,
  gstStateCodeFromGstin,
  SAAS_HSN_SAC_CODE,
} from "@/lib/billing/india-gst";

function createId() {
  return crypto.randomUUID();
}

async function getOrgBillingContext(orgId: string) {
  const [org, ownerMembership] = await Promise.all([
    db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1),
    db
      .select({ userId: organizationMemberships.userId, name: user.name, email: user.email })
      .from(organizationMemberships)
      .innerJoin(user, eq(organizationMemberships.userId, user.id))
      .innerJoin(roles, eq(organizationMemberships.roleId, roles.id))
      .where(eq(organizationMemberships.organizationId, orgId))
      .limit(1),
  ]);

  const orgData = org[0];
  const owner = ownerMembership[0];
  if (!orgData || !owner?.email) return null;

  return {
    org: { id: orgData.id, name: orgData.name },
    owner: { id: owner.userId, name: owner.name ?? "Account owner", email: owner.email },
  };
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const planCode = session.metadata?.planCode;
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;
  const stripeSubscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;

  if (!organizationId || !planCode || !stripeCustomerId || !stripeSubscriptionId) {
    logger.error("webhook.checkout_completed.missing_metadata", null, {
      organizationId,
      planCode,
      hasCustomer: !!stripeCustomerId,
      hasSubscription: !!stripeSubscriptionId,
    });
    return;
  }

  const [plan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.code, planCode))
    .limit(1);

  if (!plan) {
    logger.error("webhook.checkout_completed.plan_not_found", null, { planCode });
    return;
  }

  const stripeSub = await withStripeBreaker("subscriptions.retrieve", () =>
    stripe.subscriptions.retrieve(stripeSubscriptionId),
  );
  const { periodStart, periodEnd, trialEnd } = getSubscriptionPeriod(stripeSub);
  const subscriptionId = createId();

  await db.insert(subscriptions).values({
    id: subscriptionId,
    organizationId,
    planId: plan.id,
    status: stripeSub.status,
    billingCycle: stripeSub.items.data[0]?.plan.interval ?? "month",
    startedAt: new Date(stripeSub.start_date * 1000),
    currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    trialEndsAt: trialEnd ? new Date(trialEnd * 1000) : null,
    stripeCustomerId,
    stripeSubscriptionId,
  });

  await db
    .insert(organizationCurrentSubscriptions)
    .values({
      id: createId(),
      organizationId,
      subscriptionId,
    })
    .onConflictDoUpdate({
      target: organizationCurrentSubscriptions.organizationId,
      set: { subscriptionId, updatedAt: new Date() },
    });
}

async function upsertSubscriptionFromStripe(stripeSub: Stripe.Subscription) {
  const stripeSubscriptionId = stripeSub.id;
  const { periodStart, periodEnd, trialEnd } = getSubscriptionPeriod(stripeSub);
  const organizationId = stripeSub.metadata?.organizationId;
  const planCode = stripeSub.metadata?.planCode;

  const [existingSub] = await db
    .select({
      id: subscriptions.id,
      organizationId: subscriptions.organizationId,
      planId: subscriptions.planId,
    })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  if (existingSub) return existingSub;

  if (!organizationId || !planCode) {
    logger.error("webhook.subscription_created.missing_metadata", null, {
      stripeSubscriptionId,
      organizationId,
      planCode,
    });
    return null;
  }

  const [plan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.code, planCode))
    .limit(1);

  if (!plan) {
    logger.error("webhook.subscription_created.plan_not_found", null, { planCode });
    return null;
  }

  const stripeCustomerId = typeof stripeSub.customer === "string" ? stripeSub.customer : null;
  const subscriptionId = createId();

  await db.insert(subscriptions).values({
    id: subscriptionId,
    organizationId,
    planId: plan.id,
    status: stripeSub.status,
    billingCycle: stripeSub.items.data[0]?.plan.interval ?? "month",
    startedAt: new Date(stripeSub.start_date * 1000),
    currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    trialEndsAt: trialEnd ? new Date(trialEnd * 1000) : null,
    stripeCustomerId,
    stripeSubscriptionId,
  });

  await db
    .insert(organizationCurrentSubscriptions)
    .values({
      id: createId(),
      organizationId,
      subscriptionId,
    })
    .onConflictDoUpdate({
      target: organizationCurrentSubscriptions.organizationId,
      set: { subscriptionId, updatedAt: new Date() },
    });

  return { id: subscriptionId, organizationId, planId: plan.id };
}

async function handleSubscriptionCreated(stripeSub: Stripe.Subscription) {
  const result = await upsertSubscriptionFromStripe(stripeSub);
  if (!result) return;

  try {
    const [ctx, planRows] = await Promise.all([
      getOrgBillingContext(result.organizationId),
      db.select({ name: plans.name }).from(plans).where(eq(plans.id, result.planId)).limit(1),
    ]);
    if (ctx) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const planName = planRows?.[0]?.name ?? "Your plan";
      await onSubscriptionChanged({
        owner: ctx.owner,
        org: ctx.org,
        changeType: "upgraded",
        oldPlan: "-",
        newPlan: planName,
        billingUrl: `${appUrl}/settings/billing`,
      });
    }
  } catch (err) {
    logger.error("webhook.subscription_created.welcome_email_failed", err, {
      organizationId: result.organizationId,
    });
  }
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const stripeSubscriptionId = stripeSub.id;
  const { periodStart, periodEnd, trialEnd } = getSubscriptionPeriod(stripeSub);

  const [existingSub] = await db
    .select({
      id: subscriptions.id,
      organizationId: subscriptions.organizationId,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      planId: subscriptions.planId,
    })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  if (!existingSub) {
    await upsertSubscriptionFromStripe(stripeSub);
    return;
  }

  // Activation funnel: detect plan change. We compare the Stripe price ID on
  // the new subscription items against the price IDs registered to the plan
  // we currently have stored. Anything not in {stored monthly, stored yearly}
  // means the customer moved to a different plan.
  const newPriceId = stripeSub.items.data[0]?.price?.id ?? null;
  if (newPriceId && existingSub.organizationId) {
    try {
      const [storedPlan] = await db
        .select({
          code: plans.code,
          stripeMonthlyPriceId: plans.stripeMonthlyPriceId,
          stripeYearlyPriceId: plans.stripeYearlyPriceId,
        })
        .from(plans)
        .where(eq(plans.id, existingSub.planId))
        .limit(1);
      const isSamePlan =
        storedPlan?.stripeMonthlyPriceId === newPriceId ||
        storedPlan?.stripeYearlyPriceId === newPriceId;
      if (storedPlan && !isSamePlan) {
        const [newPlan] = await db
          .select({ code: plans.code })
          .from(plans)
          .where(
            or(
              eq(plans.stripeMonthlyPriceId, newPriceId),
              eq(plans.stripeYearlyPriceId, newPriceId),
            ),
          )
          .limit(1);
        void captureServerEvent({
          distinctId: orgDistinctId(existingSub.organizationId),
          event: FUNNEL_EVENTS.planUpgraded,
          properties: {
            organizationId: existingSub.organizationId,
            fromPlanCode: storedPlan.code,
            toPlanCode: newPlan?.code ?? "unknown",
            stripePriceId: newPriceId,
          },
        });
      }
    } catch (err) {
      logger.warn("webhook.subscription_updated.plan_change_check_failed", {
        organizationId: existingSub.organizationId,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await db
    .update(subscriptions)
    .set({
      status: stripeSub.status,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
      trialEndsAt: trialEnd ? new Date(trialEnd * 1000) : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

  if (existingSub.organizationId) {
    const changeType = resolveSubscriptionChangeType(
      { cancelAtPeriodEnd: existingSub.cancelAtPeriodEnd },
      { cancel_at_period_end: stripeSub.cancel_at_period_end },
    );

    try {
      const [ctx, planRows] = await Promise.all([
        getOrgBillingContext(existingSub.organizationId),
        db
          .select({ name: plans.name })
          .from(plans)
          .where(eq(plans.id, existingSub.planId))
          .limit(1),
      ]);
      if (ctx) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        await onSubscriptionChanged({
          owner: ctx.owner,
          org: ctx.org,
          changeType,
          oldPlan: planRows?.[0]?.name ?? "Current plan",
          newPlan: planRows?.[0]?.name ?? "Current plan",
          billingUrl: `${appUrl}/settings/billing`,
        });
      }
    } catch (err) {
      logger.error("webhook.subscription_updated.email_trigger_failed", err, {
        stripeSubscriptionId,
        organizationId: existingSub.organizationId,
      });
    }
  }
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      canceledAt: new Date(),
      endedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));
}

async function handleInvoicePaid(stripeInvoice: Stripe.Invoice) {
  const stripeSubscriptionId = getSubscriptionIdFromInvoice(stripeInvoice);
  if (!stripeSubscriptionId) return;

  const [sub] = await db
    .select({ id: subscriptions.id, organizationId: subscriptions.organizationId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  if (!sub) return;

  const paidAt = stripeInvoice.status_transitions?.paid_at
    ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
    : new Date();

  // India GST snapshot. Computed only when:
  //   - The platform's GST state code is configured (PLATFORM_GST_STATE_CODE).
  //   - The org has a GSTIN on file (B2B invoice with input-credit needs).
  //   - The currency is INR (we don't apply GST to non-INR transactions).
  // Stripe charges the gross amount (no Stripe Tax integration here), so we
  // back the subtotal + tax components out of `amount_paid`.
  const platformGstState = process.env.PLATFORM_GST_STATE_CODE ?? null;
  let gstSnapshot: {
    subtotalCents: number;
    taxBreakdown: {
      regime: "intra_state" | "inter_state" | "exempt";
      cgstCents: number;
      sgstCents: number;
      igstCents: number;
      totalTaxCents: number;
    };
    gstinAtInvoice: string | null;
    hsnSacCode: string;
  } | null = null;

  if (platformGstState && stripeInvoice.currency.toUpperCase() === "INR") {
    const [orgRow] = await db
      .select({ gstin: organizations.gstin, gstStateCode: organizations.gstStateCode })
      .from(organizations)
      .where(eq(organizations.id, sub.organizationId))
      .limit(1);
    const gstin = orgRow?.gstin ?? null;
    const buyerStateCode = orgRow?.gstStateCode ?? (gstin ? gstStateCodeFromGstin(gstin) : null);
    if (gstin) {
      const breakdown = calculateGstFromGross({
        grossCents: stripeInvoice.amount_paid,
        sellerStateCode: platformGstState,
        buyerStateCode,
      });
      gstSnapshot = {
        subtotalCents: breakdown.subtotalCents,
        taxBreakdown: {
          regime: breakdown.regime,
          cgstCents: breakdown.cgstCents,
          sgstCents: breakdown.sgstCents,
          igstCents: breakdown.igstCents,
          totalTaxCents: breakdown.totalTaxCents,
        },
        gstinAtInvoice: gstin,
        hsnSacCode: SAAS_HSN_SAC_CODE,
      };
    }
  }

  const [existing] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.externalInvoiceId, stripeInvoice.id))
    .limit(1);

  if (existing) {
    await db
      .update(invoices)
      .set({
        status: "paid",
        amountDueCents: stripeInvoice.amount_due,
        amountPaidCents: stripeInvoice.amount_paid,
        currencyCode: stripeInvoice.currency.toUpperCase(),
        invoiceUrl: stripeInvoice.hosted_invoice_url ?? null,
        paidAt,
        dunningStage: 0,
        lastDunningAt: null,
        ...(gstSnapshot
          ? {
              subtotalCents: gstSnapshot.subtotalCents,
              taxBreakdown: gstSnapshot.taxBreakdown,
              gstinAtInvoice: gstSnapshot.gstinAtInvoice,
              hsnSacCode: gstSnapshot.hsnSacCode,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, existing.id));
  } else {
    await db.insert(invoices).values({
      id: createId(),
      organizationId: sub.organizationId,
      subscriptionId: sub.id,
      externalInvoiceId: stripeInvoice.id,
      number: stripeInvoice.number ?? stripeInvoice.id,
      status: "paid",
      amountDueCents: stripeInvoice.amount_due,
      amountPaidCents: stripeInvoice.amount_paid,
      currencyCode: stripeInvoice.currency.toUpperCase(),
      invoiceUrl: stripeInvoice.hosted_invoice_url ?? null,
      paidAt,
      ...(gstSnapshot
        ? {
            subtotalCents: gstSnapshot.subtotalCents,
            taxBreakdown: gstSnapshot.taxBreakdown,
            gstinAtInvoice: gstSnapshot.gstinAtInvoice,
            hsnSacCode: gstSnapshot.hsnSacCode,
          }
        : {}),
    });
  }

  // Activation funnel: first paid invoice for this org.
  try {
    const [{ value: paidCount } = { value: 0 }] = await db
      .select({ value: count() })
      .from(invoices)
      .where(and(eq(invoices.organizationId, sub.organizationId), eq(invoices.status, "paid")));
    if (paidCount === 1) {
      void captureServerEvent({
        distinctId: orgDistinctId(sub.organizationId),
        event: FUNNEL_EVENTS.firstInvoicePaid,
        properties: {
          organizationId: sub.organizationId,
          amountPaidCents: stripeInvoice.amount_paid,
          currency: stripeInvoice.currency,
        },
      });
    }
  } catch (err) {
    logger.warn("webhook.invoice_paid.first_invoice_check_failed", {
      organizationId: sub.organizationId,
      reason: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    await dispatchWebhookEvent(sub.organizationId, "invoice.paid", {
      externalInvoiceId: stripeInvoice.id,
      amountPaid: stripeInvoice.amount_paid,
      currency: stripeInvoice.currency,
    });
  } catch (err) {
    logger.error("webhook.invoice_paid.dispatch_failed", err, {
      organizationId: sub.organizationId,
      externalInvoiceId: stripeInvoice.id,
    });
  }

  try {
    const ctx = await getOrgBillingContext(sub.organizationId);
    if (ctx) {
      const amountFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: stripeInvoice.currency.toUpperCase(),
      }).format(stripeInvoice.amount_paid / 100);
      await onInvoiceAvailable({
        owner: ctx.owner,
        org: ctx.org,
        invoice: {
          number: stripeInvoice.number ?? stripeInvoice.id,
          amountDue: amountFormatted,
          dueDate: stripeInvoice.due_date
            ? new Date(stripeInvoice.due_date * 1000).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "-",
        },
        invoiceUrl: stripeInvoice.hosted_invoice_url ?? "",
      });
    }
  } catch (err) {
    logger.error("webhook.invoice_paid.email_trigger_failed", err, {
      organizationId: sub.organizationId,
      externalInvoiceId: stripeInvoice.id,
    });
  }
}

async function handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice) {
  const stripeSubscriptionId = getSubscriptionIdFromInvoice(stripeInvoice);
  if (!stripeSubscriptionId) return;

  const [sub] = await db
    .select({ id: subscriptions.id, organizationId: subscriptions.organizationId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  if (!sub) return;

  await db
    .insert(invoices)
    .values({
      id: createId(),
      organizationId: sub.organizationId,
      subscriptionId: sub.id,
      externalInvoiceId: stripeInvoice.id,
      status: "payment_failed",
      amountDueCents: stripeInvoice.amount_due,
      amountPaidCents: 0,
      currencyCode: stripeInvoice.currency.toUpperCase(),
      invoiceUrl: stripeInvoice.hosted_invoice_url ?? null,
      dueAt: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : null,
    })
    .onConflictDoNothing();

  try {
    const ctx = await getOrgBillingContext(sub.organizationId);
    if (ctx) {
      const amountFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: stripeInvoice.currency.toUpperCase(),
      }).format(stripeInvoice.amount_due / 100);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      await onPaymentFailed({
        owner: ctx.owner,
        org: ctx.org,
        invoice: {
          number: stripeInvoice.number ?? stripeInvoice.id,
          amountDue: amountFormatted,
          dueDate: stripeInvoice.due_date
            ? new Date(stripeInvoice.due_date * 1000).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "-",
        },
        failureReason: "Your card was declined.",
        retryUrl: `${appUrl}/settings/billing`,
      });
    }
  } catch (err) {
    logger.error("webhook.invoice_payment_failed.email_trigger_failed", err, {
      organizationId: sub.organizationId,
      externalInvoiceId: stripeInvoice.id,
    });
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // Newer Stripe SDK types narrow `charge.invoice` away from this Charge
  // type - it's still on the API payload, so we read through a typed lens.
  const invoiceField = (
    charge as unknown as {
      invoice?: string | { id?: string } | null;
    }
  ).invoice;
  const externalInvoiceId =
    typeof invoiceField === "string" ? invoiceField : (invoiceField?.id ?? null);

  if (!externalInvoiceId) {
    logger.warn("webhook.charge_refunded.no_invoice", { chargeId: charge.id });
    return;
  }

  const [inv] = await db
    .select({
      id: invoices.id,
      organizationId: invoices.organizationId,
      currencyCode: invoices.currencyCode,
      number: invoices.number,
    })
    .from(invoices)
    .where(eq(invoices.externalInvoiceId, externalInvoiceId))
    .limit(1);

  if (!inv) {
    logger.warn("webhook.charge_refunded.invoice_not_found", { externalInvoiceId });
    return;
  }

  const refundedAmount = charge.amount_refunded ?? 0;
  const fullyRefunded = refundedAmount >= (charge.amount ?? 0);
  const reason = charge.refunds?.data?.[0]?.reason ?? charge.failure_message ?? null;

  await db
    .update(invoices)
    .set({
      status: fullyRefunded ? "refunded" : "partially_refunded",
      amountRefundedCents: refundedAmount,
      refundedAt: new Date(),
      refundReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, inv.id));

  try {
    await dispatchWebhookEvent(inv.organizationId, "invoice.refunded", {
      externalInvoiceId,
      invoiceNumber: inv.number ?? externalInvoiceId,
      amountRefunded: refundedAmount,
      currency: charge.currency,
      fullyRefunded,
      reason,
    });
  } catch (err) {
    logger.error("webhook.charge_refunded.dispatch_failed", err, {
      organizationId: inv.organizationId,
      externalInvoiceId,
    });
  }
}

/**
 * Single dispatcher for every Stripe event we react to. Used by both the
 * live webhook route (POST /api/billing/webhook) and the admin DLQ replay
 * endpoint - sharing this guarantees a replay runs exactly the same code
 * path as the original delivery.
 *
 * Throws on handler failure so the caller can persist `processingError`.
 */
export async function dispatchBillingEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
  }
}
