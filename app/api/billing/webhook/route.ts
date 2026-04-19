import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/server/third-party/stripe";
import { db } from "@/server/db/client";
import {
  plans,
  subscriptions,
  organizationCurrentSubscriptions,
  organizations,
  organizationMemberships,
  roles,
  invoices,
  billingWebhookEvents,
} from "@/db/schema";
import { user } from "@/db/auth-schema";
import { eq } from "drizzle-orm";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createId() {
  return crypto.randomUUID();
}

// ─── Billing email helper ─────────────────────────────────────────────────────

async function getOrgBillingContext(orgId: string) {
  const [org, ownerMembership] = await Promise.all([
    db.select({ id: organizations.id, name: organizations.name }).from(organizations).where(eq(organizations.id, orgId)).limit(1),
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

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const planCode = session.metadata?.planCode;
  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : null;
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

  // Look up plan in DB
  const [plan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.code, planCode))
    .limit(1);

  if (!plan) {
    logger.error("webhook.checkout_completed.plan_not_found", null, { planCode });
    return;
  }

  // Retrieve full subscription details from Stripe
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
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

  // Upsert the "current subscription" pointer for this org
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

  // Look up the DB subscription by Stripe ID
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

  // No existing row → create one. Requires org + plan metadata on the Stripe sub.
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

  // Welcome email: subscription is now active. Fire awaited so errors surface.
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
        oldPlan: "—",
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

  // Fetch current sub state for email trigger context
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

  // If this update arrives before a matching .created event, upsert on the fly.
  if (!existingSub) {
    await upsertSubscriptionFromStripe(stripeSub);
    return;
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

  // Email trigger: subscription lifecycle change (awaited — no silent failures)
  if (existingSub.organizationId) {
    const changeType = resolveSubscriptionChangeType(
      { cancelAtPeriodEnd: existingSub.cancelAtPeriodEnd },
      { cancel_at_period_end: stripeSub.cancel_at_period_end },
    );

    try {
      const [ctx, planRows] = await Promise.all([
        getOrgBillingContext(existingSub.organizationId),
        db.select({ name: plans.name }).from(plans).where(eq(plans.id, existingSub.planId)).limit(1),
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

  // Find the subscription in our DB
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
      status: "paid",
      amountDueCents: stripeInvoice.amount_due,
      amountPaidCents: stripeInvoice.amount_paid,
      currencyCode: stripeInvoice.currency.toUpperCase(),
      invoiceUrl: stripeInvoice.hosted_invoice_url ?? null,
      paidAt: stripeInvoice.status_transitions?.paid_at
        ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
        : new Date(),
    })
    .onConflictDoNothing();

  // Webhook dispatch: invoice.paid (awaited so errors are visible)
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

  // Email trigger: invoice available
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
            ? new Date(stripeInvoice.due_date * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
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

  // Email trigger: payment failed (awaited)
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
            ? new Date(stripeInvoice.due_date * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
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

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency - skip if already processed
  const existing = await db
    .select({ id: billingWebhookEvents.id })
    .from(billingWebhookEvents)
    .where(eq(billingWebhookEvents.eventId, event.id))
    .limit(1);

  if (existing[0]) {
    return NextResponse.json({ received: true, skipped: true });
  }

  // Log the event immediately
  const logId = createId();
  await db.insert(billingWebhookEvents).values({
    id: logId,
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    payload: event as unknown as Record<string, unknown>,
    receivedAt: new Date(),
  });

  try {
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
    }

    await db
      .update(billingWebhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(billingWebhookEvents.id, logId));
  } catch (err) {
    await db
      .update(billingWebhookEvents)
      .set({ processingError: String(err) })
      .where(eq(billingWebhookEvents.id, logId));

    logger.error("webhook.processing_failed", err, {
      eventId: event.id,
      eventType: event.type,
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
