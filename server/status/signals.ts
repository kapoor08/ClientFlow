import "server-only";

import { db } from "@/server/db/client";
import { statusServiceSignals } from "@/db/schema";
import { logger } from "@/server/observability/logger";

/**
 * Bump a service-health signal. Called from inside live code paths
 * (email send, Stripe webhook ingest, etc.) so the prober can read
 * `lastObservedAt` to derive an indirect probe result without making
 * actual outbound calls.
 *
 * Intentionally non-throwing: a failure to record a signal must NEVER
 * break the underlying flow it's instrumenting. Errors are logged and
 * swallowed.
 */
export async function bumpSignal(key: string, metadata?: Record<string, unknown>): Promise<void> {
  try {
    const now = new Date();
    await db
      .insert(statusServiceSignals)
      .values({
        signalKey: key,
        lastObservedAt: now,
        metadata: metadata ?? null,
      })
      .onConflictDoUpdate({
        target: statusServiceSignals.signalKey,
        set: { lastObservedAt: now, metadata: metadata ?? null },
      });
  } catch (err) {
    logger.error("status.signal.bump_failed", err, { signalKey: key });
  }
}

/**
 * Canonical signal keys. Component rows reference these by string in
 * `probeConfig.signalKey`; constants here keep the producer + consumer
 * in sync.
 */
export const SIGNAL_KEYS = {
  EMAIL_SEND_SUCCESS: "email_send_success",
  STRIPE_WEBHOOK_RECEIVED: "stripe_webhook_received",
} as const;
