import { NextResponse } from "next/server";
import { assertCronAuth, runCron } from "@/server/cron/guard";
import { sendGenericNotification } from "@/server/email/send";
import { logger } from "@/server/observability/logger";

/**
 * Daily heartbeat email.
 *
 * The email-delivery status component is signal-based: it reads
 * `status_service_signals.email_send_success.lastObservedAt` and considers
 * the signal stale after some threshold (default 30 min). On a low-traffic
 * day there may simply be no real customer email to keep the signal fresh,
 * which would surface as a false-positive degraded state.
 *
 * This cron sends one minimal email per day to a designated address. The
 * existing instrumentation inside `sendEmailNow` bumps the
 * `email_send_success` signal on success, so the prober sees fresh data
 * regardless of organic email volume.
 *
 * No-op when `STATUS_HEARTBEAT_EMAIL` isn't set - the deployment hasn't
 * opted into heartbeating.
 */
export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  const recipient = process.env.STATUS_HEARTBEAT_EMAIL;
  if (!recipient) {
    logger.info("status.heartbeat.skipped_no_recipient");
    return NextResponse.json({ ok: true, skipped: "no_recipient" });
  }

  return runCron("status-email-heartbeat", async () => {
    await sendGenericNotification(recipient, {
      recipient_name: "Status heartbeat",
      title: "ClientFlow Status email heartbeat",
      body: `Daily heartbeat to keep the email-delivery status signal fresh. Sent at ${new Date().toISOString()}.`,
    });
    return { sent: 1, recipient };
  });
}
