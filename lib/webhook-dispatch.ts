import "server-only";

import { createHmac } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { outboundWebhooks } from "@/db/schema";
import type { WebhookEvent } from "@/lib/webhooks-shared";

/**
 * Fire-and-forget HTTP POST to all active webhooks subscribed to `event`
 * for the given organization.
 *
 * Each request is signed with HMAC-SHA256 on the raw body and delivered
 * concurrently (Promise.allSettled — one failure does not block others).
 * Requests time out after 10 seconds.
 */
export async function dispatchWebhookEvent(
  organizationId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  // Filter by org + active flag + subscribed event (jsonb array containment)
  const hooks = await db
    .select({
      id: outboundWebhooks.id,
      url: outboundWebhooks.url,
      secret: outboundWebhooks.secret,
    })
    .from(outboundWebhooks)
    .where(
      and(
        eq(outboundWebhooks.organizationId, organizationId),
        eq(outboundWebhooks.isActive, true),
        sql`${outboundWebhooks.events} @> ${JSON.stringify([event])}::jsonb`,
      ),
    );

  if (hooks.length === 0) return;

  const body = JSON.stringify({
    event,
    data: payload,
    timestamp: new Date().toISOString(),
  });

  await Promise.allSettled(
    hooks.map(async (hook) => {
      const sig = createHmac("sha256", hook.secret).update(body).digest("hex");
      const headers = {
        "Content-Type": "application/json",
        "X-ClientFlow-Signature": `sha256=${sig}`,
        "X-ClientFlow-Event": event,
      };

      // Retry up to 3 times with exponential backoff (1s, 2s, 4s)
      const MAX_ATTEMPTS = 3;
      let delivered = false;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
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
          if (res.ok || (res.status >= 200 && res.status < 300)) {
            delivered = true;
            break;
          }
          // 4xx errors are permanent failures — no point retrying
          if (res.status >= 400 && res.status < 500) break;
        } catch {
          // Network/timeout error — retry if attempts remain
        }
      }

      // Record delivery time on success or after exhausting retries
      if (delivered) {
        await db
          .update(outboundWebhooks)
          .set({ lastTriggeredAt: new Date() })
          .where(eq(outboundWebhooks.id, hook.id));
      }
    }),
  );
}
