import "server-only";

import { count, desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  organizations,
  outboundWebhooks,
  outboundWebhookDeliveries,
  platformAdminActions,
} from "@/db/schema";
import { dispatchWebhookEvent } from "@/server/webhooks/dispatch";
import type { WebhookEvent } from "@/schemas/webhooks";
import { buildPaginationMeta, paginationOffset, type PaginatedResult } from "@/utils/pagination";

export type AdminWebhookDeliveryRow = {
  id: string;
  webhookId: string;
  webhookName: string;
  webhookUrl: string;
  orgName: string;
  event: string;
  status: string;
  attempts: number;
  responseStatus: number | null;
  error: string | null;
  createdAt: Date;
};

type ListOptions = {
  status?: "exhausted" | "permanent_fail" | "delivered" | "all";
  page?: number;
  pageSize?: number;
};

export async function listWebhookDeliveries(
  opts: ListOptions = {},
): Promise<PaginatedResult<AdminWebhookDeliveryRow>> {
  const { status = "exhausted", page = 1, pageSize = 25 } = opts;

  const where = status === "all" ? undefined : eq(outboundWebhookDeliveries.status, status);

  const [{ total }] = await db
    .select({ total: count(outboundWebhookDeliveries.id) })
    .from(outboundWebhookDeliveries)
    .where(where);

  const pagination = buildPaginationMeta(total, page, pageSize);

  const rows = await db
    .select({
      id: outboundWebhookDeliveries.id,
      webhookId: outboundWebhookDeliveries.webhookId,
      webhookName: outboundWebhooks.name,
      webhookUrl: outboundWebhooks.url,
      orgName: organizations.name,
      event: outboundWebhookDeliveries.event,
      status: outboundWebhookDeliveries.status,
      attempts: outboundWebhookDeliveries.attempts,
      responseStatus: outboundWebhookDeliveries.responseStatus,
      error: outboundWebhookDeliveries.error,
      createdAt: outboundWebhookDeliveries.createdAt,
    })
    .from(outboundWebhookDeliveries)
    .innerJoin(outboundWebhooks, eq(outboundWebhookDeliveries.webhookId, outboundWebhooks.id))
    .innerJoin(organizations, eq(outboundWebhookDeliveries.organizationId, organizations.id))
    .where(where)
    .orderBy(desc(outboundWebhookDeliveries.createdAt))
    .limit(pagination.pageSize)
    .offset(paginationOffset(pagination.page, pagination.pageSize));

  return { data: rows, pagination };
}

export async function replayWebhookDelivery(
  deliveryId: string,
  adminUserId: string,
): Promise<{ replayed: boolean; reason?: string }> {
  const [row] = await db
    .select({
      id: outboundWebhookDeliveries.id,
      webhookId: outboundWebhookDeliveries.webhookId,
      organizationId: outboundWebhookDeliveries.organizationId,
      event: outboundWebhookDeliveries.event,
      payload: outboundWebhookDeliveries.payload,
      status: outboundWebhookDeliveries.status,
    })
    .from(outboundWebhookDeliveries)
    .where(eq(outboundWebhookDeliveries.id, deliveryId))
    .limit(1);

  if (!row) return { replayed: false, reason: "not_found" };
  // Don't replay deliveries that already succeeded - that would cause a
  // duplicate event at the customer's endpoint.
  if (row.status === "delivered") {
    return { replayed: false, reason: "already_delivered" };
  }

  await dispatchWebhookEvent(
    row.organizationId,
    row.event as WebhookEvent,
    row.payload as Record<string, unknown>,
    { replayOfDeliveryId: row.id, webhookId: row.webhookId },
  );

  await db.insert(platformAdminActions).values({
    id: crypto.randomUUID(),
    platformAdminUserId: adminUserId,
    action: "replay_webhook_delivery",
    entityType: "webhook_delivery",
    entityId: deliveryId,
    organizationId: row.organizationId,
    afterSnapshot: { event: row.event, webhookId: row.webhookId },
  });

  return { replayed: true };
}
