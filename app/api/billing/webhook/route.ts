import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import {
  plans,
  subscriptions,
  organizationCurrentSubscriptions,
  invoices,
  billingWebhookEvents,
} from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createId() {
  return crypto.randomUUID();
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
  const subscriptionId = createId();

  await db.insert(subscriptions).values({
    id: subscriptionId,
    organizationId,
    planId: plan.id,
    status: stripeSub.status,
    billingCycle: stripeSub.items.data[0]?.plan.interval ?? "month",
    startedAt: new Date(stripeSub.start_date * 1000),
    currentPeriodStart: new Date(stripeSub.items.data[0]?.current_period_start ?? stripeSub.start_date * 1000),
    currentPeriodEnd: new Date(stripeSub.items.data[0]?.current_period_end ?? (stripeSub.start_date + 30 * 86400) * 1000),
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    trialEndsAt: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
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

  await db
    .update(subscriptions)
    .set({
      status: stripeSub.status,
      currentPeriodStart: new Date(stripeSub.items.data[0]?.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.items.data[0]?.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
      trialEndsAt: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
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

  // Idempotency — skip if already processed
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
