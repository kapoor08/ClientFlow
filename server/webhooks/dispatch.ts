import "server-only";

import { createHmac } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { outboundWebhooks, outboundWebhookDeliveries } from "@/db/schema";
import type { WebhookEvent } from "@/schemas/webhooks";

type DispatchOptions = {
  /** When set, the resulting delivery row records this as a replay-of pointer. */
  replayOfDeliveryId?: string;
  /** When set, only this single webhook is dispatched (used by replay). */
  webhookId?: string;
};

type DeliveryStatus = "delivered" | "permanent_fail" | "exhausted";

const MAX_ATTEMPTS = 3;

async function deliverOne(
  hook: { id: string; url: string; secret: string },
  event: WebhookEvent,
  body: string,
): Promise<{
  status: DeliveryStatus;
  attempts: number;
  responseStatus: number | null;
  error: string | null;
}> {
  const sig = createHmac("sha256", hook.secret).update(body).digest("hex");
  const headers = {
    "Content-Type": "application/json",
    "X-ClientFlow-Signature": `sha256=${sig}`,
    "X-ClientFlow-Event": event,
  };

  let lastResponseStatus: number | null = null;
  let lastError: string | null = null;
  let attempts = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    attempts = attempt + 1;
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1_000 * Math.pow(2, attempt - 1)));
    }
    try {
      const res = await fetch(hook.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10_000),
      });
      lastResponseStatus = res.status;
      lastError = null;

      if (res.status >= 200 && res.status < 300) {
        return { status: "delivered", attempts, responseStatus: res.status, error: null };
      }
      // 4xx is permanent - do not retry, do not DLQ for replay.
      if (res.status >= 400 && res.status < 500) {
        return {
          status: "permanent_fail",
          attempts,
          responseStatus: res.status,
          error: `HTTP ${res.status}`,
        };
      }
      // 5xx - fall through to retry
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    status: "exhausted",
    attempts,
    responseStatus: lastResponseStatus,
    error: lastError ?? `HTTP ${lastResponseStatus}`,
  };
}

/**
 * Fire-and-forget HTTP POST to all active webhooks subscribed to `event`
 * for the given organization.
 *
 * Each request is signed with HMAC-SHA256 on the raw body and delivered
 * concurrently (Promise.allSettled - one failure does not block others).
 * Requests time out after 10 seconds and retry up to 3 times on 5xx /
 * network errors with exponential backoff (1s, 2s, 4s).
 *
 * Every dispatch - success or failure - is logged to outboundWebhookDeliveries.
 * Rows with status="exhausted" can be replayed from /admin/webhook-deliveries.
 */
export async function dispatchWebhookEvent(
  organizationId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
  options: DispatchOptions = {},
): Promise<void> {
  // Filter by org + active flag + subscribed event (jsonb array containment).
  // When replaying a single delivery we narrow to that exact webhook id.
  const whereParts = [
    eq(outboundWebhooks.organizationId, organizationId),
    eq(outboundWebhooks.isActive, true),
    sql`${outboundWebhooks.events} @> ${JSON.stringify([event])}::jsonb`,
  ];
  if (options.webhookId) {
    whereParts.push(eq(outboundWebhooks.id, options.webhookId));
  }

  const hooks = await db
    .select({
      id: outboundWebhooks.id,
      url: outboundWebhooks.url,
      secret: outboundWebhooks.secret,
    })
    .from(outboundWebhooks)
    .where(and(...whereParts));

  if (hooks.length === 0) return;

  const body = JSON.stringify({
    event,
    data: payload,
    timestamp: new Date().toISOString(),
  });

  await Promise.allSettled(
    hooks.map(async (hook) => {
      const result = await deliverOne(hook, event, body);

      const now = new Date();
      await db.insert(outboundWebhookDeliveries).values({
        id: crypto.randomUUID(),
        webhookId: hook.id,
        organizationId,
        event,
        payload,
        status: result.status,
        attempts: result.attempts,
        responseStatus: result.responseStatus,
        error: result.error,
        deliveredAt: result.status === "delivered" ? now : null,
        replayOfDeliveryId: options.replayOfDeliveryId ?? null,
      });

      if (result.status === "delivered") {
        await db
          .update(outboundWebhooks)
          .set({ lastTriggeredAt: now })
          .where(eq(outboundWebhooks.id, hook.id));
      }
    }),
  );
}
