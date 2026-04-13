import "server-only";

import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import { organizations, outboundWebhooks } from "@/db/schema";
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

export async function deactivateWebhook(webhookId: string) {
  await db.update(outboundWebhooks).set({ isActive: false, updatedAt: new Date() }).where(eq(outboundWebhooks.id, webhookId));
}

export async function deleteWebhook(webhookId: string) {
  await db.delete(outboundWebhooks).where(eq(outboundWebhooks.id, webhookId));
}
