import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { organizations, supportTicketMessages, supportTickets } from "@/db/schema";
import { user } from "@/db/auth-schema";

// ── SLA defaults (minutes) ────────────────────────────────────────────────────

const DEFAULT_SLA: Record<string, { firstResponseMinutes: number; resolutionMinutes: number }> = {
  urgent: { firstResponseMinutes: 60, resolutionMinutes: 240 },
  high: { firstResponseMinutes: 240, resolutionMinutes: 1440 },
  normal: { firstResponseMinutes: 480, resolutionMinutes: 2880 },
  low: { firstResponseMinutes: 1440, resolutionMinutes: 4320 },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export type PortalTicketRow = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  messageCount: number;
  firstResponseDueAt: Date | null;
  firstRespondedAt: Date | null;
  lastActivityAt: Date;
  createdAt: Date;
};

export type PortalTicketMessage = {
  id: string;
  authorName: string | null;
  authorRole: string;
  body: string;
  createdAt: Date;
};

export type PortalTicketDetail = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  firstResponseDueAt: Date | null;
  firstRespondedAt: Date | null;
  resolutionDueAt: Date | null;
  resolvedAt: Date | null;
  lastActivityAt: Date;
  createdAt: Date;
  messages: PortalTicketMessage[];
};

// ── Read operations ───────────────────────────────────────────────────────────

export async function listSupportTickets(orgId: string): Promise<PortalTicketRow[]> {
  const rows = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      status: supportTickets.status,
      priority: supportTickets.priority,
      category: supportTickets.category,
      messageCount: sql<number>`(
        SELECT count(*)::int FROM support_ticket_messages
        WHERE ticket_id = ${supportTickets.id}
      )`,
      firstResponseDueAt: supportTickets.firstResponseDueAt,
      firstRespondedAt: supportTickets.firstRespondedAt,
      lastActivityAt: supportTickets.lastActivityAt,
      createdAt: supportTickets.createdAt,
    })
    .from(supportTickets)
    .where(eq(supportTickets.organizationId, orgId))
    .orderBy(sql`${supportTickets.lastActivityAt} DESC`);

  return rows;
}

export async function getSupportTicket(
  ticketId: string,
  orgId: string,
): Promise<PortalTicketDetail | null> {
  const [ticket] = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      description: supportTickets.description,
      status: supportTickets.status,
      priority: supportTickets.priority,
      category: supportTickets.category,
      firstResponseDueAt: supportTickets.firstResponseDueAt,
      firstRespondedAt: supportTickets.firstRespondedAt,
      resolutionDueAt: supportTickets.resolutionDueAt,
      resolvedAt: supportTickets.resolvedAt,
      lastActivityAt: supportTickets.lastActivityAt,
      createdAt: supportTickets.createdAt,
    })
    .from(supportTickets)
    .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.organizationId, orgId)));

  if (!ticket) return null;

  const messages = await db
    .select({
      id: supportTicketMessages.id,
      authorName: user.name,
      authorRole: supportTicketMessages.authorRole,
      body: supportTicketMessages.body,
      createdAt: supportTicketMessages.createdAt,
    })
    .from(supportTicketMessages)
    .leftJoin(user, eq(user.id, supportTicketMessages.authorUserId))
    .where(
      and(
        eq(supportTicketMessages.ticketId, ticketId),
        eq(supportTicketMessages.isInternal, false),
      ),
    )
    .orderBy(asc(supportTicketMessages.createdAt));

  return { ...ticket, messages };
}

// ── Write operations ──────────────────────────────────────────────────────────

type CreateTicketInput = {
  subject: string;
  description: string;
  category: string;
  priority: string;
};

export async function createSupportTicket(
  userId: string,
  orgId: string,
  input: CreateTicketInput,
): Promise<string> {
  const sla = DEFAULT_SLA[input.priority] ?? DEFAULT_SLA.normal;
  const now = new Date();
  const firstResponseDueAt = new Date(now.getTime() + sla.firstResponseMinutes * 60_000);
  const resolutionDueAt = new Date(now.getTime() + sla.resolutionMinutes * 60_000);

  const [row] = await db
    .insert(supportTickets)
    .values({
      id: sql`gen_random_uuid()`,
      organizationId: orgId,
      createdByUserId: userId,
      subject: input.subject,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: "open",
      firstResponseDueAt,
      resolutionDueAt,
      lastActivityAt: now,
    })
    .returning({ id: supportTickets.id });

  return row.id;
}

export async function addTicketMessage(
  ticketId: string,
  authorUserId: string,
  authorRole: string,
  body: string,
  isInternal = false,
): Promise<void> {
  const now = new Date();

  await db.insert(supportTicketMessages).values({
    id: sql`gen_random_uuid()`,
    ticketId,
    authorUserId,
    authorRole,
    body,
    isInternal,
  });

  await db
    .update(supportTickets)
    .set({
      lastActivityAt: now,
      // Mark first response if this is an admin reply
      firstRespondedAt:
        authorRole === "admin"
          ? sql`COALESCE(${supportTickets.firstRespondedAt}, ${now})`
          : supportTickets.firstRespondedAt,
    })
    .where(eq(supportTickets.id, ticketId));
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  actorUserId: string,
): Promise<void> {
  const now = new Date();
  await db
    .update(supportTickets)
    .set({
      status,
      resolvedAt: status === "resolved" ? now : supportTickets.resolvedAt,
      closedAt: status === "closed" ? now : supportTickets.closedAt,
      lastActivityAt: now,
      updatedAt: now,
    })
    .where(eq(supportTickets.id, ticketId));
}

export async function assignTicket(
  ticketId: string,
  adminUserId: string | null,
): Promise<void> {
  await db
    .update(supportTickets)
    .set({
      assignedPlatformAdminUserId: adminUserId,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, ticketId));
}
