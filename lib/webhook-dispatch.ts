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

      try {
        await fetch(hook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-ClientFlow-Signature": `sha256=${sig}`,
            "X-ClientFlow-Event": event,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        // Delivery failures are intentionally swallowed (fire-and-forget)
      }

      // Record delivery time regardless of HTTP response code
      await db
        .update(outboundWebhooks)
        .set({ lastTriggeredAt: new Date() })
        .where(eq(outboundWebhooks.id, hook.id));
    }),
  );
}
