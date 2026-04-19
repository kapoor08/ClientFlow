import { NextResponse } from "next/server";
import { and, eq, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { supportTickets, supportTicketEvents } from "@/db/schema";
import { assertCronAuth } from "@/server/cron/guard";
import { logger } from "@/server/observability/logger";

/**
 * Hourly SLA sweep — runs every hour at :15.
 *
 * Finds tickets that have breached their first-response or resolution SLA
 * without having been alerted yet. Writes a ticket event ("sla.first_response_breach"
 * or "sla.resolution_breach") so the breach shows up in the ticket history,
 * sets the `..._breach_notified_at` flag, and emits a warn-level log so
 * Sentry / alerting picks it up for platform oncall.
 */
export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  const now = new Date();
  const results: Record<string, number | string> = {};

  // ── First-response SLA breach ──────────────────────────────────────────────
  try {
    const breached = await db
      .select({
        id: supportTickets.id,
        organizationId: supportTickets.organizationId,
        subject: supportTickets.subject,
        priority: supportTickets.priority,
        firstResponseDueAt: supportTickets.firstResponseDueAt,
      })
      .from(supportTickets)
      .where(
        and(
          lt(supportTickets.firstResponseDueAt, now),
          isNull(supportTickets.firstRespondedAt),
          isNull(supportTickets.firstResponseBreachNotifiedAt),
        ),
      );

    for (const ticket of breached) {
      await db.insert(supportTicketEvents).values({
        id: sql`gen_random_uuid()`,
        ticketId: ticket.id,
        actorUserId: null,
        eventType: "sla.first_response_breach",
        newValues: {
          priority: ticket.priority,
          dueAt: ticket.firstResponseDueAt?.toISOString() ?? null,
        },
      });

      logger.warn("support.sla.first_response_breach", {
        ticketId: ticket.id,
        organizationId: ticket.organizationId,
        priority: ticket.priority,
        subject: ticket.subject,
      });
    }

    if (breached.length > 0) {
      await db
        .update(supportTickets)
        .set({ firstResponseBreachNotifiedAt: now })
        .where(
          and(
            lt(supportTickets.firstResponseDueAt, now),
            isNull(supportTickets.firstRespondedAt),
            isNull(supportTickets.firstResponseBreachNotifiedAt),
          ),
        );
    }

    results.firstResponseBreaches = breached.length;
  } catch (err) {
    logger.error("cron.support_sla.first_response_failed", err);
    results.firstResponseBreaches = "error";
  }

  // ── Resolution SLA breach ──────────────────────────────────────────────────
  try {
    const breached = await db
      .select({
        id: supportTickets.id,
        organizationId: supportTickets.organizationId,
        subject: supportTickets.subject,
        priority: supportTickets.priority,
        resolutionDueAt: supportTickets.resolutionDueAt,
      })
      .from(supportTickets)
      .where(
        and(
          lt(supportTickets.resolutionDueAt, now),
          ne(supportTickets.status, "resolved"),
          ne(supportTickets.status, "closed"),
          isNull(supportTickets.resolutionBreachNotifiedAt),
        ),
      );

    for (const ticket of breached) {
      await db.insert(supportTicketEvents).values({
        id: sql`gen_random_uuid()`,
        ticketId: ticket.id,
        actorUserId: null,
        eventType: "sla.resolution_breach",
        newValues: {
          priority: ticket.priority,
          dueAt: ticket.resolutionDueAt?.toISOString() ?? null,
        },
      });

      logger.warn("support.sla.resolution_breach", {
        ticketId: ticket.id,
        organizationId: ticket.organizationId,
        priority: ticket.priority,
        subject: ticket.subject,
      });
    }

    if (breached.length > 0) {
      await db
        .update(supportTickets)
        .set({ resolutionBreachNotifiedAt: now })
        .where(
          and(
            lt(supportTickets.resolutionDueAt, now),
            ne(supportTickets.status, "resolved"),
            ne(supportTickets.status, "closed"),
            isNull(supportTickets.resolutionBreachNotifiedAt),
          ),
        );
    }

    results.resolutionBreaches = breached.length;
  } catch (err) {
    logger.error("cron.support_sla.resolution_failed", err);
    results.resolutionBreaches = "error";
  }

  logger.info("cron.support_sla.done", results);
  return NextResponse.json({ ok: true, ...results });
}
