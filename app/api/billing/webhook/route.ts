import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { stripe } from "@/server/third-party/stripe";
import { db } from "@/server/db/client";
import { billingWebhookEvents } from "@/db/schema";
import { dispatchBillingEvent } from "@/server/billing/event-handlers";
import { logger } from "@/server/observability/logger";

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
  const logId = crypto.randomUUID();
  await db.insert(billingWebhookEvents).values({
    id: logId,
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    payload: event as unknown as Record<string, unknown>,
    receivedAt: new Date(),
  });

  try {
    await dispatchBillingEvent(event);

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
