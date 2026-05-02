import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { stripe } from "@/server/third-party/stripe";
import { db } from "@/server/db/client";
import { billingWebhookEvents } from "@/db/schema";
import { dispatchBillingEvent } from "@/server/billing/event-handlers";
import { logger } from "@/server/observability/logger";
import { bumpSignal, SIGNAL_KEYS } from "@/server/status/signals";

/**
 * Stripe webhook receiver.
 *
 * Idempotency is enforced via the unique index on (provider, event_id):
 *   1. Atomically claim the event row with INSERT ... ON CONFLICT DO NOTHING.
 *   2. Read the row back regardless of whether we just inserted it. If
 *      `processedAt` is set, skip - the event was already handled. If null,
 *      a previous attempt either failed or is in-flight; re-dispatch
 *      (handlers are keyed on Stripe IDs, so re-runs are safe).
 *   3. On dispatch success, set `processedAt`. On failure, record
 *      `processingError` and return 500 so Stripe retries with backoff.
 *
 * Without step (2) a single transient failure would permanently brick an
 * event: Stripe's retry would find the row, dedupe on eventId, and never
 * reach the dispatcher again.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Heartbeat for the "Payment processing" status component. Bumped on every
  // signature-verified Stripe event so the prober can read `lastObservedAt`
  // without making outbound calls of its own.
  void bumpSignal(SIGNAL_KEYS.STRIPE_WEBHOOK_RECEIVED, { eventType: event.type });

  // Atomically claim the event row. ON CONFLICT relies on the unique index
  // on (provider, event_id) to make concurrent deliveries safe.
  await db
    .insert(billingWebhookEvents)
    .values({
      id: crypto.randomUUID(),
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      payload: event as unknown as Record<string, unknown>,
      receivedAt: new Date(),
    })
    .onConflictDoNothing({
      target: [billingWebhookEvents.provider, billingWebhookEvents.eventId],
    });

  const [row] = await db
    .select({
      id: billingWebhookEvents.id,
      processedAt: billingWebhookEvents.processedAt,
    })
    .from(billingWebhookEvents)
    .where(
      and(eq(billingWebhookEvents.provider, "stripe"), eq(billingWebhookEvents.eventId, event.id)),
    )
    .limit(1);

  if (!row) {
    // Should never happen - either the insert succeeded or the conflict
    // means a row already exists. Log loudly if we hit this.
    logger.error("webhook.event_row_missing", null, { eventId: event.id });
    return NextResponse.json({ error: "Event row missing after insert" }, { status: 500 });
  }

  if (row.processedAt) {
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    await dispatchBillingEvent(event);

    await db
      .update(billingWebhookEvents)
      .set({ processedAt: new Date(), processingError: null })
      .where(eq(billingWebhookEvents.id, row.id));
  } catch (err) {
    await db
      .update(billingWebhookEvents)
      .set({ processingError: String(err) })
      .where(eq(billingWebhookEvents.id, row.id));

    logger.error("webhook.processing_failed", err, {
      eventId: event.id,
      eventType: event.type,
    });
    // 500 → Stripe retries the same event with exponential backoff. Next
    // delivery re-enters this handler, finds processedAt still null, and
    // re-dispatches. Recovery from transient failure works.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
