import "server-only";

import type Stripe from "stripe";
import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { billingWebhookEvents, platformAdminActions } from "@/db/schema";
import { dispatchBillingEvent } from "@/server/billing/event-handlers";
import { logger } from "@/server/observability/logger";
import { buildPaginationMeta, paginationOffset, type PaginatedResult } from "@/utils/pagination";

export type BillingWebhookEventRow = {
  id: string;
  eventId: string;
  eventType: string;
  receivedAt: Date;
  processedAt: Date | null;
  processingError: string | null;
};

type ListOptions = {
  status?: "failed" | "processed" | "all";
  page?: number;
  pageSize?: number;
};

/**
 * Lists inbound Stripe webhook events. Default filter is "failed" - i.e. rows
 * where the handler threw (`processingError IS NOT NULL`) and the event
 * therefore did not finish processing. Those are the rows an admin needs to
 * action.
 */
export async function listBillingWebhookEvents(
  opts: ListOptions = {},
): Promise<PaginatedResult<BillingWebhookEventRow>> {
  const { status = "failed", page = 1, pageSize = 25 } = opts;

  const where =
    status === "failed"
      ? and(
          eq(billingWebhookEvents.provider, "stripe"),
          isNotNull(billingWebhookEvents.processingError),
        )
      : status === "processed"
        ? and(
            eq(billingWebhookEvents.provider, "stripe"),
            isNotNull(billingWebhookEvents.processedAt),
            isNull(billingWebhookEvents.processingError),
          )
        : eq(billingWebhookEvents.provider, "stripe");

  const [{ total }] = await db
    .select({ total: count(billingWebhookEvents.id) })
    .from(billingWebhookEvents)
    .where(where);

  const pagination = buildPaginationMeta(total, page, pageSize);

  const rows = await db
    .select({
      id: billingWebhookEvents.id,
      eventId: billingWebhookEvents.eventId,
      eventType: billingWebhookEvents.eventType,
      receivedAt: billingWebhookEvents.receivedAt,
      processedAt: billingWebhookEvents.processedAt,
      processingError: billingWebhookEvents.processingError,
    })
    .from(billingWebhookEvents)
    .where(where)
    .orderBy(desc(billingWebhookEvents.receivedAt))
    .limit(pagination.pageSize)
    .offset(paginationOffset(pagination.page, pagination.pageSize));

  return { data: rows, pagination };
}

/**
 * Re-runs a failed event through the same dispatcher the live route uses. On
 * success, clears `processingError` and stamps `processedAt`. On failure,
 * overwrites `processingError` with the new message so the row still shows in
 * the failed list.
 *
 * Replaying a row that already succeeded is a no-op.
 */
export async function replayBillingWebhookEvent(
  rowId: string,
  adminUserId: string,
): Promise<{ replayed: boolean; reason?: string }> {
  const [row] = await db
    .select({
      id: billingWebhookEvents.id,
      eventId: billingWebhookEvents.eventId,
      eventType: billingWebhookEvents.eventType,
      payload: billingWebhookEvents.payload,
      processedAt: billingWebhookEvents.processedAt,
      processingError: billingWebhookEvents.processingError,
    })
    .from(billingWebhookEvents)
    .where(eq(billingWebhookEvents.id, rowId))
    .limit(1);

  if (!row) return { replayed: false, reason: "not_found" };
  if (row.processedAt && !row.processingError) {
    return { replayed: false, reason: "already_processed" };
  }
  if (!row.payload) return { replayed: false, reason: "no_payload" };

  const event = row.payload as unknown as Stripe.Event;

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

    logger.error("admin.billing_webhook_replay.failed", err, {
      rowId: row.id,
      eventId: row.eventId,
      eventType: row.eventType,
    });
    return { replayed: false, reason: "handler_threw" };
  }

  await db.insert(platformAdminActions).values({
    id: crypto.randomUUID(),
    platformAdminUserId: adminUserId,
    action: "replay_billing_webhook_event",
    entityType: "billing_webhook_event",
    entityId: row.id,
    afterSnapshot: { eventId: row.eventId, eventType: row.eventType },
  });

  return { replayed: true };
}
