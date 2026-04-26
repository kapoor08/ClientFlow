import { NextResponse } from "next/server";
import { addSuppression } from "@/server/email/suppressions";
import {
  verifyResendWebhook,
  extractRecipientEmails,
  type ResendWebhookEvent,
} from "@/server/email/resend-webhook";
import { logger } from "@/server/observability/logger";

/**
 * Inbound Resend webhook.
 *
 * Configure in Resend dashboard → Webhooks, pointing at:
 *   https://client-flow.in/api/webhooks/resend
 *
 * Subscribe to at minimum: `email.bounced`, `email.complained`,
 * `email.delivery_delayed`. Copy the signing secret into Vercel as
 * `RESEND_WEBHOOK_SECRET`.
 *
 * Hard bounces and complaints → `email_suppressions` table. Soft bounces
 * and delivery delays are logged for forensics only (transient failures
 * should not permanently suppress the address).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const verdict = verifyResendWebhook(
    rawBody,
    {
      id: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature"),
    },
    process.env.RESEND_WEBHOOK_SECRET,
  );

  if (!verdict.ok) {
    // Return 401 - Resend will retry, and a persistent mismatch surfaces in
    // the Resend dashboard for the operator to fix (usually a wrong secret).
    logger.warn("email.resend_webhook.rejected", { reason: verdict.reason });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { event } = verdict;

  try {
    await handleEvent(event);
  } catch (err) {
    logger.error("email.resend_webhook.handler_failed", err, {
      eventType: event.type,
    });
    // 500 → Resend retries. Handlers are idempotent (onConflictDoNothing).
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: ResendWebhookEvent) {
  const recipients = extractRecipientEmails(event);

  switch (event.type) {
    case "email.bounced": {
      // Only hard bounces are permanent. Soft bounces (mailbox full, temp
      // DNS failure) will recover - suppressing them permanently kills
      // otherwise-deliverable addresses.
      const bounceType = event.data?.bounce?.type?.toLowerCase();
      if (bounceType !== "hard") {
        logger.info("email.bounce.soft", {
          bounceType: bounceType ?? "unknown",
          recipientCount: recipients.length,
        });
        return;
      }
      for (const email of recipients) {
        await addSuppression({
          email,
          reason: "bounce",
          source: "resend-webhook",
          metadata: {
            bounceType,
            subType: event.data?.bounce?.subType,
            message: event.data?.bounce?.message,
            emailId: event.data?.email_id,
          },
        });
      }
      logger.info("email.bounce.hard", { recipientCount: recipients.length });
      return;
    }

    case "email.complained": {
      for (const email of recipients) {
        await addSuppression({
          email,
          reason: "complaint",
          source: "resend-webhook",
          metadata: {
            complaintType: event.data?.complaint?.type,
            emailId: event.data?.email_id,
          },
        });
      }
      // Complaint rate >0.3% over 24h is the single biggest deliverability
      // killer - surface these as warnings so they stand out in Sentry.
      logger.warn("email.complaint", { recipientCount: recipients.length });
      return;
    }

    case "email.delivery_delayed": {
      logger.warn("email.delivery_delayed", {
        recipientCount: recipients.length,
        emailId: event.data?.email_id,
      });
      return;
    }

    default:
      // Other event types (email.sent, email.delivered, email.opened, etc.)
      // are acknowledged but not acted on. Resend sends them when subscribed.
      return;
  }
}
