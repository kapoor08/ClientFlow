import "server-only";

import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { organizations, outboundWebhooks, platformAdminActions } from "@/db/schema";
import {
  buildPaginationMeta,
  paginationOffset,
  type PaginatedResult,
} from "@/utils/pagination";

export type AdminWebhookRow = {
  id: string;
  name: string;
  url: string;
  events: string[] | null;
  isActive: boolean;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  orgName: string;
};

type ListAdminWebhooksOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
  status?: string;
};

export async function listAdminWebhooks(
  opts: ListAdminWebhooksOptions = {},
): Promise<PaginatedResult<AdminWebhookRow>> {
  const { query, page = 1, pageSize = 20, status } = opts;

  // ── WHERE conditions ────────────────────────────────────────────────────────
  const conditions = [];

  if (query?.trim()) {
    const q = `%${query.trim()}%`;
    conditions.push(
      or(
        ilike(outboundWebhooks.name, q),
        ilike(outboundWebhooks.url, q),
        ilike(organizations.name, q),
      )!,
    );
  }
  if (status === "active") conditions.push(eq(outboundWebhooks.isActive, true));
  if (status === "inactive") conditions.push(eq(outboundWebhooks.isActive, false));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count(outboundWebhooks.id) })
    .from(outboundWebhooks)
    .innerJoin(organizations, eq(outboundWebhooks.organizationId, organizations.id))
    .where(where);

  const pagination = buildPaginationMeta(total, page, pageSize);

  const rows = await db
    .select({
      id: outboundWebhooks.id,
      name: outboundWebhooks.name,
      url: outboundWebhooks.url,
      events: outboundWebhooks.events,
      isActive: outboundWebhooks.isActive,
      lastTriggeredAt: outboundWebhooks.lastTriggeredAt,
      createdAt: outboundWebhooks.createdAt,
      orgName: organizations.name,
    })
    .from(outboundWebhooks)
    .innerJoin(organizations, eq(outboundWebhooks.organizationId, organizations.id))
    .where(where)
    .orderBy(desc(outboundWebhooks.createdAt))
    .limit(pagination.pageSize)
    .offset(paginationOffset(pagination.page, pagination.pageSize));

  return { data: rows, pagination };
}

async function getWebhookMeta(webhookId: string) {
  const [row] = await db
    .select({
      organizationId: outboundWebhooks.organizationId,
      name: outboundWebhooks.name,
      url: outboundWebhooks.url,
    })
    .from(outboundWebhooks)
    .where(eq(outboundWebhooks.id, webhookId))
    .limit(1);
  return row ?? null;
}

export async function deactivateWebhook(webhookId: string, adminUserId: string) {
  const meta = await getWebhookMeta(webhookId);
  await db.update(outboundWebhooks).set({ isActive: false, updatedAt: new Date() }).where(eq(outboundWebhooks.id, webhookId));

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: adminUserId,
    action: "deactivate_webhook",
    entityType: "webhook",
    entityId: webhookId,
    organizationId: meta?.organizationId ?? null,
    afterSnapshot: { name: meta?.name ?? null, url: meta?.url ?? null },
  });
}

export async function deleteWebhook(webhookId: string, adminUserId: string) {
  const meta = await getWebhookMeta(webhookId);
  await db.delete(outboundWebhooks).where(eq(outboundWebhooks.id, webhookId));

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: adminUserId,
    action: "delete_webhook",
    entityType: "webhook",
    entityId: webhookId,
    organizationId: meta?.organizationId ?? null,
    afterSnapshot: { name: meta?.name ?? null, url: meta?.url ?? null },
  });
}
