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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createId() {
  return crypto.randomUUID();
}

/**
 * In Stripe API 2024-09-30+, current_period_start/end were moved from the
 * top-level Subscription object to each SubscriptionItem. This helper reads
 * from the item level first and falls back to the (now-removed) top-level
 * field so the code works across API versions.
 */
function getSubscriptionPeriod(stripeSub: Stripe.Subscription): {
  periodStart: number | undefined;
  periodEnd: number | undefined;
  trialEnd: number | null;
} {
  const item = stripeSub.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_start?: number; current_period_end?: number })
    | undefined;
  const sub = stripeSub as unknown as Record<string, unknown>;

  const periodStart =
    item?.current_period_start ??
    (typeof sub.current_period_start === "number" ? sub.current_period_start : undefined);
  const periodEnd =
    item?.current_period_end ??
    (typeof sub.current_period_end === "number" ? sub.current_period_end : undefined);
  const trialEnd = stripeSub.trial_end ?? null;

  return { periodStart, periodEnd, trialEnd };
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
    console.error("checkout.session.completed: missing metadata", session.metadata);
    return;
  }

  // Look up plan in DB
  const [plan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.code, planCode))
    .limit(1);

  if (!plan) {
    console.error("checkout.session.completed: plan not found for code", planCode);
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

  // Email trigger: subscription lifecycle change
  if (existingSub?.organizationId) {
    const changeType: "cancelled" | "resumed" | "upgraded" =
      stripeSub.cancel_at_period_end && !existingSub.cancelAtPeriodEnd
        ? "cancelled"
        : !stripeSub.cancel_at_period_end && existingSub.cancelAtPeriodEnd
          ? "resumed"
          : "upgraded";

    Promise.all([
      getOrgBillingContext(existingSub.organizationId),
      db.select({ name: plans.name }).from(plans).where(eq(plans.id, existingSub.planId)).limit(1),
    ]).then(([ctx, planRows]) => {
      if (!ctx) return;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      return onSubscriptionChanged({
        owner: ctx.owner,
        org: ctx.org,
        changeType,
        oldPlan: planRows?.[0]?.name ?? "Current plan",
        newPlan: planRows?.[0]?.name ?? "Current plan",
        billingUrl: `${appUrl}/settings/billing`,
      });
    }).catch(console.error);
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

function getSubscriptionIdFromInvoice(stripeInvoice: Stripe.Invoice): string | null {
  // Stripe 2026+ uses parent.subscription_item.subscription; older versions used .subscription directly
  const inv = stripeInvoice as unknown as Record<string, unknown>;
  const parent = inv.parent as Record<string, unknown> | undefined;
  const subItem = parent?.subscription_item as Record<string, unknown> | undefined;
  const fromParent = typeof subItem?.subscription === "string" ? subItem.subscription : null;
  const fromLegacy = typeof inv.subscription === "string" ? (inv.subscription as string) : null;
  return fromParent ?? fromLegacy;
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

  // Webhook dispatch: invoice.paid
  dispatchWebhookEvent(sub.organizationId, "invoice.paid", {
    externalInvoiceId: stripeInvoice.id,
    amountPaid: stripeInvoice.amount_paid,
    currency: stripeInvoice.currency,
  }).catch(console.error);

  // Email trigger: invoice available
  getOrgBillingContext(sub.organizationId).then((ctx) => {
    if (!ctx) return;
    const amountFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: stripeInvoice.currency.toUpperCase(),
    }).format(stripeInvoice.amount_paid / 100);
    return onInvoiceAvailable({
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
  }).catch(console.error);
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

  // Email trigger: payment failed
  getOrgBillingContext(sub.organizationId).then((ctx) => {
    if (!ctx) return;
    const amountFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: stripeInvoice.currency.toUpperCase(),
    }).format(stripeInvoice.amount_due / 100);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return onPaymentFailed({
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
  }).catch(console.error);
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

    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
