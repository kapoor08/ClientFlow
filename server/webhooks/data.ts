import "server-only";

import { createHash, randomBytes } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { outboundWebhooks } from "@/db/schema";
import { db } from "@/server/db/client";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { writeAuditLog } from "@/server/security/audit";

export type WebhookItem = {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: Date | null;
  createdAt: Date;
};

export { WEBHOOK_EVENTS, type WebhookEvent } from "@/schemas/webhooks";

function generateSecret(): string {
  return `wh_${randomBytes(32).toString("hex")}`;
}

export async function listWebhooksForUser(userId: string): Promise<WebhookItem[] | null> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) return null;

  const rows = await db
    .select({
      id: outboundWebhooks.id,
      name: outboundWebhooks.name,
      url: outboundWebhooks.url,
      secret: outboundWebhooks.secret,
      events: outboundWebhooks.events,
      isActive: outboundWebhooks.isActive,
      lastTriggeredAt: outboundWebhooks.lastTriggeredAt,
      createdAt: outboundWebhooks.createdAt,
    })
    .from(outboundWebhooks)
    .where(eq(outboundWebhooks.organizationId, ctx.organizationId))
    .orderBy(desc(outboundWebhooks.createdAt));

  return rows.map((r) => ({ ...r, events: (r.events as string[]) ?? [] }));
}

export async function createWebhookForUser(
  userId: string,
  data: { name: string; url: string; events: string[] },
): Promise<WebhookItem> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings) throw new Error("Only admins can create webhooks.");

  const id = crypto.randomUUID();
  const secret = generateSecret();

  const [row] = await db
    .insert(outboundWebhooks)
    .values({
      id,
      organizationId: ctx.organizationId,
      name: data.name.trim(),
      url: data.url.trim(),
      secret,
      events: data.events,
      createdByUserId: userId,
    })
    .returning();

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: userId,
    action: "webhook.created",
    entityType: "webhook",
    entityId: id,
    metadata: { name: row.name, url: row.url, events: data.events },
  }).catch(console.error);

  return { ...row, events: (row.events as string[]) ?? [] };
}

export async function updateWebhookForUser(
  userId: string,
  webhookId: string,
  data: Partial<{ name: string; url: string; events: string[]; isActive: boolean }>,
): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings) throw new Error("Only admins can update webhooks.");

  const [existing] = await db
    .select({ id: outboundWebhooks.id, name: outboundWebhooks.name })
    .from(outboundWebhooks)
    .where(and(eq(outboundWebhooks.id, webhookId), eq(outboundWebhooks.organizationId, ctx.organizationId)))
    .limit(1);

  if (!existing) throw new Error("Webhook not found.");

  await db
    .update(outboundWebhooks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(outboundWebhooks.id, webhookId));

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: userId,
    action: "webhook.updated",
    entityType: "webhook",
    entityId: webhookId,
    metadata: { name: existing.name, changes: Object.keys(data) },
  }).catch(console.error);
}

export async function deleteWebhookForUser(userId: string, webhookId: string): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings) throw new Error("Only admins can delete webhooks.");

  const [existing] = await db
    .select({ id: outboundWebhooks.id, name: outboundWebhooks.name, url: outboundWebhooks.url })
    .from(outboundWebhooks)
    .where(and(eq(outboundWebhooks.id, webhookId), eq(outboundWebhooks.organizationId, ctx.organizationId)))
    .limit(1);

  if (!existing) throw new Error("Webhook not found.");

  await db.delete(outboundWebhooks).where(eq(outboundWebhooks.id, webhookId));

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: userId,
    action: "webhook.deleted",
    entityType: "webhook",
    entityId: webhookId,
    metadata: { name: existing.name, url: existing.url },
  }).catch(console.error);
}
