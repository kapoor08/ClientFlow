import "server-only";

import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  statusComponents,
  statusIncidentComponents,
  statusIncidents,
  statusSubscribers,
} from "@/db/schema";
import { isSuppressed } from "@/server/email/suppressions";
import { sendGenericNotification } from "@/server/email/send";
import { getStatusBaseUrl, getStatusUnsubscribeUrl } from "@/server/status/urls";
import { logger } from "@/server/observability/logger";

const PER_RECIPIENT_THROTTLE_MS = 60_000;

export type IncidentNotificationKind = "opened" | "updated" | "resolved" | "scheduled";

/**
 * Fan out an incident-lifecycle email to all verified status subscribers.
 *
 * Caller passes `incidentId` + the lifecycle event kind + the just-posted
 * update body. Everything else (title, slug, state, impact, components,
 * scheduled window) is fetched here so action code stays small.
 *
 * - **Per-recipient throttle**: skips subscribers whose `lastEmailedAt` is
 *   within the last 60s. Stops a flapping incident from generating one
 *   email per state transition.
 * - **Suppression honored**: defense in depth on top of the email pipeline's
 *   own suppression check.
 * - **Best-effort**: per-subscriber failures are logged and continue. This
 *   function never throws back to the caller (an admin action shouldn't
 *   fail because one subscriber's email bounced).
 *
 * Run in the background by callers (`void dispatchIncidentEmails(...)`)
 * so it doesn't block the action's response.
 */
export async function dispatchIncidentEmails(args: {
  incidentId: string;
  kind: IncidentNotificationKind;
  updateBody: string;
}): Promise<void> {
  try {
    const incidentRow = await loadIncidentForEmail(args.incidentId);
    if (!incidentRow) return;

    const verifiedSubscribers = await db
      .select({
        id: statusSubscribers.id,
        email: statusSubscribers.email,
        lastEmailedAt: statusSubscribers.lastEmailedAt,
      })
      .from(statusSubscribers)
      .where(isNotNull(statusSubscribers.verifiedAt));

    if (verifiedSubscribers.length === 0) return;

    const now = Date.now();
    const eligible = verifiedSubscribers.filter(
      (s) => !s.lastEmailedAt || now - s.lastEmailedAt.getTime() >= PER_RECIPIENT_THROTTLE_MS,
    );

    if (eligible.length === 0) {
      logger.info("status.notify.all_throttled", {
        kind: args.kind,
        slug: incidentRow.slug,
        total: verifiedSubscribers.length,
      });
      return;
    }

    const subject = subjectFor({
      kind: args.kind,
      title: incidentRow.title,
      state: incidentRow.currentState,
    });
    const body = bodyFor({
      kind: args.kind,
      updateBody: args.updateBody,
      affectedComponentNames: incidentRow.componentNames,
      scheduledFor: incidentRow.scheduledFor,
      scheduledUntil: incidentRow.scheduledUntil,
    });
    const actionUrl = `${getStatusBaseUrl()}/incidents/${incidentRow.slug}`;

    let sent = 0;
    let suppressed = 0;
    let failed = 0;

    await Promise.all(
      eligible.map(async (sub) => {
        try {
          if (await isSuppressed(sub.email)) {
            suppressed++;
            return;
          }
          await sendGenericNotification(
            sub.email,
            {
              recipient_name: sub.email,
              title: subject,
              body,
              action_url: actionUrl,
            },
            {
              module: "status",
              unsubscribeUrlOverride: getStatusUnsubscribeUrl(sub.email),
            },
          );
          await db
            .update(statusSubscribers)
            .set({ lastEmailedAt: new Date() })
            .where(eq(statusSubscribers.id, sub.id));
          sent++;
        } catch (err) {
          failed++;
          logger.error("status.notify.send_failed", err, {
            subscriberId: sub.id,
            slug: incidentRow.slug,
          });
        }
      }),
    );

    logger.info("status.notify.dispatched", {
      kind: args.kind,
      slug: incidentRow.slug,
      sent,
      suppressed,
      failed,
      throttled: verifiedSubscribers.length - eligible.length,
    });
  } catch (err) {
    logger.error("status.notify.dispatch_failed", err, {
      incidentId: args.incidentId,
    });
  }
}

async function loadIncidentForEmail(incidentId: string): Promise<{
  title: string;
  slug: string;
  currentState: string;
  scheduledFor: Date | null;
  scheduledUntil: Date | null;
  componentNames: string[];
} | null> {
  const [row] = await db
    .select({
      title: statusIncidents.title,
      slug: statusIncidents.slug,
      currentState: statusIncidents.currentState,
      scheduledFor: statusIncidents.scheduledFor,
      scheduledUntil: statusIncidents.scheduledUntil,
    })
    .from(statusIncidents)
    .where(eq(statusIncidents.id, incidentId))
    .limit(1);

  if (!row) return null;

  const componentLinks = await db
    .select({ name: statusComponents.name })
    .from(statusIncidentComponents)
    .innerJoin(statusComponents, eq(statusIncidentComponents.componentId, statusComponents.id))
    .where(eq(statusIncidentComponents.incidentId, incidentId));

  return {
    ...row,
    componentNames: componentLinks.map((l) => l.name),
  };
}

function subjectFor(args: {
  kind: IncidentNotificationKind;
  title: string;
  state: string;
}): string {
  switch (args.kind) {
    case "opened":
      return `[Investigating] ${args.title}`;
    case "updated":
      return `[${capitalize(args.state)}] ${args.title}`;
    case "resolved":
      return `[Resolved] ${args.title}`;
    case "scheduled":
      return `[Scheduled] ${args.title}`;
  }
}

function bodyFor(args: {
  kind: IncidentNotificationKind;
  updateBody: string;
  affectedComponentNames: string[];
  scheduledFor: Date | null;
  scheduledUntil: Date | null;
}): string {
  const components =
    args.affectedComponentNames.length > 0
      ? `Affecting: ${args.affectedComponentNames.join(", ")}.`
      : "";

  const window =
    args.kind === "scheduled" && args.scheduledFor && args.scheduledUntil
      ? `Window: ${args.scheduledFor.toUTCString()} – ${args.scheduledUntil.toUTCString()}.`
      : "";

  const lead =
    args.kind === "opened"
      ? "We're aware of an issue and are investigating."
      : args.kind === "scheduled"
        ? "Scheduled maintenance has been announced."
        : args.kind === "resolved"
          ? "This incident has been resolved."
          : "There's an update on this incident.";

  return [lead, components, window, "", args.updateBody].filter(Boolean).join("\n\n");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
