import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import {
  statusComponents,
  statusIncidentComponents,
  statusIncidentUpdates,
  statusIncidents,
} from "@/db/schema";
import { dispatchIncidentEmails } from "@/server/status/notifications";
import { logger } from "@/server/observability/logger";

/**
 * Auto-open an "investigating" incident when a component has been in
 * `outage` state for at least `autoOpenIncidentAfterMin` minutes AND no
 * existing non-resolved incident covers it.
 *
 * Idempotency:
 *   - The deterministic slug (`auto-<componentSlug>-<outageStartedSec>`)
 *     ensures that two parallel probes both clearing the threshold cannot
 *     create two incidents for the same outage event - the second hits
 *     the unique-slug constraint and is treated as already-handled.
 *   - The "no existing non-resolved incident" check prevents repeat opens
 *     after a resolution + new probe failure within the same elapsed
 *     window (the next outage will have a different `stateUpdatedAt` and
 *     therefore a different slug, but we still don't want to spam
 *     overlapping incidents).
 *
 * Best-effort: errors are logged and swallowed - a failed auto-open
 * shouldn't break the probe loop.
 */
export async function maybeOpenAutoIncident(
  componentId: string,
  componentName: string,
  componentSlug: string,
  autoOpenIncidentAfterMin: number,
  outageStartedAt: Date,
): Promise<void> {
  try {
    const elapsedMs = Date.now() - outageStartedAt.getTime();
    if (elapsedMs < autoOpenIncidentAfterMin * 60_000) return;

    // Skip if any non-resolved incident already covers this component.
    const existing = await db
      .select({ id: statusIncidents.id })
      .from(statusIncidentComponents)
      .innerJoin(statusIncidents, eq(statusIncidentComponents.incidentId, statusIncidents.id))
      .where(
        and(
          eq(statusIncidentComponents.componentId, componentId),
          isNull(statusIncidents.resolvedAt),
        ),
      )
      .limit(1);
    if (existing.length > 0) return;

    const outageStartedSec = Math.floor(outageStartedAt.getTime() / 1000);
    const slug = `auto-${componentSlug}-${outageStartedSec}`;
    const id = crypto.randomUUID();
    const initialBody = `Auto-detected outage on ${componentName}. Our team is investigating.`;
    const startedAt = outageStartedAt;

    try {
      await db.transaction(async (tx) => {
        await tx.insert(statusIncidents).values({
          id,
          slug,
          title: `Outage on ${componentName}`,
          startedAt,
          currentState: "investigating",
          impact: "major",
          isScheduled: false,
          postedByUserId: null,
          isAutoOpened: true,
        });
        await tx.insert(statusIncidentUpdates).values({
          id: crypto.randomUUID(),
          incidentId: id,
          body: initialBody,
          stateAtPost: "investigating",
          postedByUserId: null,
        });
        await tx.insert(statusIncidentComponents).values({
          incidentId: id,
          componentId,
        });
      });
    } catch (err) {
      // Slug-conflict means a parallel probe already opened this exact
      // incident. That's the desired outcome - no work to do.
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("status_incidents_slug_unique") || message.includes("duplicate key")) {
        return;
      }
      throw err;
    }

    revalidatePath("/admin/status/incidents");
    revalidatePath("/status");
    revalidatePath(`/status/incidents/${slug}`);

    void dispatchIncidentEmails({
      incidentId: id,
      kind: "opened",
      updateBody: initialBody,
    });

    // Also touch the cached component row so admin UIs reflect the
    // latest auto-open in real time. Lightweight: just `updatedAt`.
    await db
      .update(statusComponents)
      .set({ updatedAt: new Date() })
      .where(eq(statusComponents.id, componentId));

    logger.info("status.auto_incident.opened", {
      slug,
      componentId,
      componentName,
      outageMs: elapsedMs,
    });
  } catch (err) {
    logger.error("status.auto_incident.failed", err, {
      componentId,
      componentName,
    });
  }
}
