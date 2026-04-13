import "server-only";

import { and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  contactSubmissions,
  organizations,
  supportTicketMessages,
  supportTickets,
  supportTicketEvents,
} from "@/db/schema";
import { user } from "@/db/auth-schema";
import {
  buildPaginationMeta,
  paginationOffset,
  type PaginatedResult,
} from "@/utils/pagination";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminTicketRow = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  orgId: string;
  orgName: string;
  createdByName: string | null;
  assignedAdminName: string | null;
  messageCount: number;
  lastActivityAt: Date;
  firstResponseDueAt: Date | null;
  firstRespondedAt: Date | null;
  escalationLevel: number;
  createdAt: Date;
};

export type AdminTicketMessage = {
  id: string;
  authorName: string | null;
  authorEmail: string | null;
  authorRole: string;
  body: string;
  isInternal: boolean;
  createdAt: Date;
};

export type AdminTicketEvent = {
  id: string;
  actorName: string | null;
  eventType: string;
  newValues: Record<string, unknown> | null;
  createdAt: Date;
};

export type AdminTicketDetail = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  orgId: string;
  orgName: string;
  createdByName: string | null;
  createdByEmail: string | null;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  firstResponseDueAt: Date | null;
  firstRespondedAt: Date | null;
  resolutionDueAt: Date | null;
  resolvedAt: Date | null;
  escalationLevel: number;
  lastActivityAt: Date;
  createdAt: Date;
  messages: AdminTicketMessage[];
  events: AdminTicketEvent[];
};

export type AdminContactSubmissionRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  subject: string;
  message: string;
  status: string;
  notes: string | null;
  convertedToTicketId: string | null;
  processedByName: string | null;
  createdAt: Date;
  processedAt: Date | null;
};

// ── Ticket list ───────────────────────────────────────────────────────────────

type ListAdminTicketsOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  category?: string;
};

export async function listAdminTickets(
  opts: ListAdminTicketsOptions = {},
): Promise<PaginatedResult<AdminTicketRow>> {
  const { query, page = 1, pageSize = 20, status, priority, category } = opts;

  const conditions = [];
  if (query?.trim()) {
    conditions.push(ilike(supportTickets.subject, `%${query.trim()}%`));
  }
  if (status) conditions.push(eq(supportTickets.status, status));
  if (priority) conditions.push(eq(supportTickets.priority, priority));
  if (category) conditions.push(eq(supportTickets.category, category));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow, rows] = await Promise.all([
    db
      .select({ total: count(supportTickets.id) })
      .from(supportTickets)
      .where(where)
      .then((r) => r[0]),

    db
      .select({
        id: supportTickets.id,
        subject: supportTickets.subject,
        status: supportTickets.status,
        priority: supportTickets.priority,
        category: supportTickets.category,
        orgId: supportTickets.organizationId,
        orgName: organizations.name,
        createdByName: sql<string | null>`creator.name`,
        assignedAdminName: sql<string | null>`assigned_admin.name`,
        messageCount: sql<number>`(
          SELECT count(*)::int FROM support_ticket_messages
          WHERE ticket_id = ${supportTickets.id}
        )`,
        lastActivityAt: supportTickets.lastActivityAt,
        firstResponseDueAt: supportTickets.firstResponseDueAt,
        firstRespondedAt: supportTickets.firstRespondedAt,
        escalationLevel: supportTickets.escalationLevel,
        createdAt: supportTickets.createdAt,
      })
      .from(supportTickets)
      .leftJoin(organizations, eq(organizations.id, supportTickets.organizationId))
      .leftJoin(
        sql`"user" AS creator`,
        sql`creator.id = ${supportTickets.createdByUserId}`,
      )
      .leftJoin(
        sql`"user" AS assigned_admin`,
        sql`assigned_admin.id = ${supportTickets.assignedPlatformAdminUserId}`,
      )
      .where(where)
      .orderBy(desc(supportTickets.lastActivityAt))
      .limit(pageSize)
      .offset(paginationOffset(page, pageSize)),
  ]);

  return {
    data: rows as AdminTicketRow[],
    pagination: buildPaginationMeta(Number(totalRow?.total ?? 0), page, pageSize),
  };
}

// ── Ticket detail ─────────────────────────────────────────────────────────────

export async function getAdminTicketDetail(
  ticketId: string,
): Promise<AdminTicketDetail | null> {
  const [ticketRow] = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      description: supportTickets.description,
      status: supportTickets.status,
      priority: supportTickets.priority,
      category: supportTickets.category,
      orgId: supportTickets.organizationId,
      orgName: organizations.name,
      createdByName: sql<string | null>`creator.name`,
      createdByEmail: sql<string | null>`creator.email`,
      assignedAdminId: supportTickets.assignedPlatformAdminUserId,
      assignedAdminName: sql<string | null>`assigned_admin.name`,
      firstResponseDueAt: supportTickets.firstResponseDueAt,
      firstRespondedAt: supportTickets.firstRespondedAt,
      resolutionDueAt: supportTickets.resolutionDueAt,
      resolvedAt: supportTickets.resolvedAt,
      escalationLevel: supportTickets.escalationLevel,
      lastActivityAt: supportTickets.lastActivityAt,
      createdAt: supportTickets.createdAt,
    })
    .from(supportTickets)
    .leftJoin(organizations, eq(organizations.id, supportTickets.organizationId))
    .leftJoin(
      sql`"user" AS creator`,
      sql`creator.id = ${supportTickets.createdByUserId}`,
    )
    .leftJoin(
      sql`"user" AS assigned_admin`,
      sql`assigned_admin.id = ${supportTickets.assignedPlatformAdminUserId}`,
    )
    .where(eq(supportTickets.id, ticketId));

  if (!ticketRow) return null;

  const [messages, events] = await Promise.all([
    db
      .select({
        id: supportTicketMessages.id,
        authorName: user.name,
        authorEmail: user.email,
        authorRole: supportTicketMessages.authorRole,
        body: supportTicketMessages.body,
        isInternal: supportTicketMessages.isInternal,
        createdAt: supportTicketMessages.createdAt,
      })
      .from(supportTicketMessages)
      .leftJoin(user, eq(user.id, supportTicketMessages.authorUserId))
      .where(eq(supportTicketMessages.ticketId, ticketId))
      .orderBy(asc(supportTicketMessages.createdAt)),

    db
      .select({
        id: supportTicketEvents.id,
        actorName: user.name,
        eventType: supportTicketEvents.eventType,
        newValues: supportTicketEvents.newValues,
        createdAt: supportTicketEvents.createdAt,
      })
      .from(supportTicketEvents)
      .leftJoin(user, eq(user.id, supportTicketEvents.actorUserId))
      .where(eq(supportTicketEvents.ticketId, ticketId))
      .orderBy(desc(supportTicketEvents.createdAt))
      .limit(20)
      .then((rows) =>
        rows.map((r) => ({
          ...r,
          newValues: r.newValues as Record<string, unknown> | null,
        })),
      ),
  ]);

  return {
    ...(ticketRow as Omit<AdminTicketDetail, "messages" | "events">),
    messages,
    events,
  };
}

// ── Contact submissions ───────────────────────────────────────────────────────

type ListContactSubmissionsOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
  status?: string;
};

export async function listAdminContactSubmissions(
  opts: ListContactSubmissionsOptions = {},
): Promise<PaginatedResult<AdminContactSubmissionRow>> {
  const { query, page = 1, pageSize = 20, status } = opts;

  const conditions = [];
  if (query?.trim()) {
    conditions.push(ilike(contactSubmissions.email, `%${query.trim()}%`));
  }
  if (status) conditions.push(eq(contactSubmissions.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow, rows] = await Promise.all([
    db
      .select({ total: count(contactSubmissions.id) })
      .from(contactSubmissions)
      .where(where)
      .then((r) => r[0]),

    db
      .select({
        id: contactSubmissions.id,
        name: contactSubmissions.name,
        email: contactSubmissions.email,
        company: contactSubmissions.company,
        subject: contactSubmissions.subject,
        message: contactSubmissions.message,
        status: contactSubmissions.status,
        notes: contactSubmissions.notes,
        convertedToTicketId: contactSubmissions.convertedToTicketId,
        processedByName: user.name,
        createdAt: contactSubmissions.createdAt,
        processedAt: contactSubmissions.processedAt,
      })
      .from(contactSubmissions)
      .leftJoin(user, eq(user.id, contactSubmissions.processedByUserId))
      .where(where)
      .orderBy(desc(contactSubmissions.createdAt))
      .limit(pageSize)
      .offset(paginationOffset(page, pageSize)),
  ]);

  return {
    data: rows,
    pagination: buildPaginationMeta(Number(totalRow?.total ?? 0), page, pageSize),
  };
}
