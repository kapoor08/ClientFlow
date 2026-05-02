import "server-only";

import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { db } from "@/server/db/client";
import { statusCheckResults, statusIncidents, statusIncidentComponents } from "@/db/schema";
import type { ComponentState } from "@/db/schemas/status";

/**
 * State derivation tunables.
 *
 * RECENT_WINDOW = 5 means we look at the last 5 probe results. On a 1-min
 * cadence that's a 5-minute window.
 *
 * CONSECUTIVE_OUTAGE_THRESHOLD = 3 means three failures in a row at the
 * leading edge (most-recent end) flips the component to outage. Three
 * minutes feels like the right balance: short enough that customers see
 * the page update during a real incident, long enough to absorb a single
 * blip from a Lambda cold-start or a transient DNS hiccup.
 */
export const RECENT_WINDOW = 5;
export const CONSECUTIVE_OUTAGE_THRESHOLD = 3;

/**
 * Pure decision function exported for unit tests. Given the most-recent-first
 * results array and a maintenance flag, returns the derived state. Knows
 * nothing about the database.
 */
export function deriveStateFromResults(
  recentMostRecentFirst: ReadonlyArray<{ success: boolean }>,
  inMaintenance: boolean,
): ComponentState {
  if (inMaintenance) return "maintenance";
  if (recentMostRecentFirst.length === 0) return "unknown";

  let consecutiveFailures = 0;
  for (const r of recentMostRecentFirst) {
    if (r.success) break;
    consecutiveFailures++;
  }
  if (consecutiveFailures >= CONSECUTIVE_OUTAGE_THRESHOLD) return "outage";

  const failures = recentMostRecentFirst.filter((r) => !r.success).length;
  if (failures === 0) return "operational";
  return "degraded";
}

/**
 * Resolve a component's current state by reading recent probe results and
 * checking for an active maintenance window.
 */
export async function deriveCurrentState(componentId: string): Promise<ComponentState> {
  const [inMaintenance, recent] = await Promise.all([
    isComponentInMaintenance(componentId),
    db
      .select({ success: statusCheckResults.success })
      .from(statusCheckResults)
      .where(eq(statusCheckResults.componentId, componentId))
      .orderBy(desc(statusCheckResults.checkedAt))
      .limit(RECENT_WINDOW),
  ]);

  return deriveStateFromResults(recent, inMaintenance);
}

/**
 * Returns true when a scheduled-maintenance incident covering this component
 * is currently within its window and not yet resolved.
 */
async function isComponentInMaintenance(componentId: string): Promise<boolean> {
  const now = new Date();
  const rows = await db
    .select({ id: statusIncidents.id })
    .from(statusIncidents)
    .innerJoin(
      statusIncidentComponents,
      eq(statusIncidentComponents.incidentId, statusIncidents.id),
    )
    .where(
      and(
        eq(statusIncidentComponents.componentId, componentId),
        eq(statusIncidents.isScheduled, true),
        lte(statusIncidents.scheduledFor, now),
        gte(statusIncidents.scheduledUntil, now),
        isNull(statusIncidents.resolvedAt),
      ),
    )
    .limit(1);

  return rows.length > 0;
}
