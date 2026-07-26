import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { stripe } from "@/server/third-party/stripe";
import { db } from "@/server/db/client";
import { billingWebhookEvents } from "@/db/schema";
import { dispatchBillingEvent } from "@/server/billing/event-handlers";
import { logger } from "@/server/observability/logger";
import { bumpSignal, SIGNAL_KEYS } from "@/server/status/signals";

/**
 * Stripe webhook receiver.
 *
 * Idempotency + concurrency safety:
 *   1. Ensure the event row exists (INSERT ... ON CONFLICT DO NOTHING on the
 *      unique (provider, event_id) index).
 *   2. Atomically CLAIM it with a conditional UPDATE that sets
 *      `processing_started_at` only when the event is unprocessed and unclaimed
 *      (or its claim is stale). Only one concurrent delivery wins the claim;
 *      the rest get no row back and skip, so the dispatcher runs exactly once.
 *   3. On dispatch success set `processed_at`. On failure clear the claim and
 *      return 500 so Stripe retries with backoff and the next delivery
 *      re-claims and re-dispatches (handlers are keyed on Stripe IDs, so
 *      re-runs are safe). A crashed worker's claim is reclaimed after
 *      CLAIM_STALE_MS.
 */
const CLAIM_STALE_MS = 5 * 60 * 1000; // reclaim an in-flight claim after 5 min

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

  // Ensure the event row exists. The unique index on (provider, event_id)
  // makes this idempotent across retries and concurrent deliveries.
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

  // Atomically CLAIM the event: a single conditional UPDATE flips
  // processing_started_at only if the event is unprocessed AND unclaimed (or
  // its claim is stale). Concurrent deliveries of the same event get no row
  // back and skip, so the dispatcher runs exactly once.
  const staleCutoff = new Date(Date.now() - CLAIM_STALE_MS);
  const claimed = await db
    .update(billingWebhookEvents)
    .set({ processingStartedAt: new Date() })
    .where(
      and(
        eq(billingWebhookEvents.provider, "stripe"),
        eq(billingWebhookEvents.eventId, event.id),
        isNull(billingWebhookEvents.processedAt),
        or(
          isNull(billingWebhookEvents.processingStartedAt),
          lt(billingWebhookEvents.processingStartedAt, staleCutoff),
        ),
      ),
    )
    .returning({ id: billingWebhookEvents.id });

  if (claimed.length === 0) {
    // Already processed, or another worker holds a fresh claim.
    return NextResponse.json({ received: true, skipped: true });
  }
  const rowId = claimed[0].id;

  try {
    await dispatchBillingEvent(event);

    await db
      .update(billingWebhookEvents)
      .set({ processedAt: new Date(), processingError: null })
      .where(eq(billingWebhookEvents.id, rowId));
  } catch (err) {
    // Release the claim so the next Stripe retry can re-process; record the
    // error for observability.
    await db
      .update(billingWebhookEvents)
      .set({ processingStartedAt: null, processingError: String(err) })
      .where(eq(billingWebhookEvents.id, rowId));

    logger.error("webhook.processing_failed", err, {
      eventId: event.id,
      eventType: event.type,
    });
    // 500 → Stripe retries the same event with exponential backoff. The next
    // delivery re-enters this handler, re-claims (processing_started_at was
    // cleared), and re-dispatches. Recovery from transient failure works.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
