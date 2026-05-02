import "server-only";

import { and, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  statusCheckDailyRollups,
  statusCheckResults,
  statusIncidentComponents,
  statusIncidents,
} from "@/db/schema";
import { computeDayRollup, nextDay, utcDayStart } from "@/server/status/rollup";
import type { ComponentState } from "@/db/schemas/status";

export type UptimeBarDay = {
  date: Date;
  state: ComponentState;
  uptimeBp: number | null;
  totalChecks: number;
};

const BAR_DAYS = 90;
const DAY_MS = 86_400_000;

/**
 * Build 90-day uptime bars for the given components in a single round of
 * batched queries:
 *   1. All rollups for the last 89 days (yesterday and earlier) for these
 *      components.
 *   2. Today's raw probe results (the rollup hasn't run yet for today).
 *   3. Maintenance windows touching today (so today's bar respects the
 *      overlay).
 *
 * Returns oldest-first arrays of length 90 per component. Days with no
 * data render as `unknown` (gray) on the page.
 */
export async function getUptimeBarsByComponent(
  componentIds: string[],
): Promise<Map<string, UptimeBarDay[]>> {
  const result = new Map<string, UptimeBarDay[]>();
  if (componentIds.length === 0) return result;

  const today = utcDayStart(new Date());
  const windowStart = new Date(today.getTime() - (BAR_DAYS - 1) * DAY_MS);
  const tomorrow = nextDay(today);

  // Days array: oldest first, length 90, ending at `today`.
  const days: Date[] = [];
  for (let i = BAR_DAYS - 1; i >= 0; i--) {
    days.push(new Date(today.getTime() - i * DAY_MS));
  }

  const [rollups, todayResults, todayMaintenance] = await Promise.all([
    db
      .select({
        componentId: statusCheckDailyRollups.componentId,
        date: statusCheckDailyRollups.date,
        uptimeBp: statusCheckDailyRollups.uptimeBp,
        totalChecks: statusCheckDailyRollups.totalChecks,
        worstStateOnDay: statusCheckDailyRollups.worstStateOnDay,
      })
      .from(statusCheckDailyRollups)
      .where(
        and(
          inArray(statusCheckDailyRollups.componentId, componentIds),
          gte(statusCheckDailyRollups.date, windowStart),
          lt(statusCheckDailyRollups.date, today),
        ),
      ),
    db
      .select({
        componentId: statusCheckResults.componentId,
        success: statusCheckResults.success,
        latencyMs: statusCheckResults.latencyMs,
      })
      .from(statusCheckResults)
      .where(
        and(
          inArray(statusCheckResults.componentId, componentIds),
          gte(statusCheckResults.checkedAt, today),
          lt(statusCheckResults.checkedAt, tomorrow),
        ),
      ),
    // Maintenance windows that overlap *today* per component.
    db
      .select({
        componentId: statusIncidentComponents.componentId,
        scheduledFor: statusIncidents.scheduledFor,
        scheduledUntil: statusIncidents.scheduledUntil,
      })
      .from(statusIncidents)
      .innerJoin(
        statusIncidentComponents,
        and(inArray(statusIncidentComponents.componentId, componentIds)),
      )
      .where(
        and(gte(statusIncidents.scheduledUntil, today), lt(statusIncidents.scheduledFor, tomorrow)),
      ),
  ]);

  // Index rollups: Map<componentId, Map<dayMs, rollup>>
  const rollupIndex = new Map<string, Map<number, (typeof rollups)[number]>>();
  for (const r of rollups) {
    const inner = rollupIndex.get(r.componentId) ?? new Map();
    inner.set(utcDayStart(r.date).getTime(), r);
    rollupIndex.set(r.componentId, inner);
  }

  // Group today's raw results by component.
  const todayByComponent = new Map<string, Array<{ success: boolean; latencyMs: number | null }>>();
  for (const r of todayResults) {
    const arr = todayByComponent.get(r.componentId) ?? [];
    arr.push({ success: r.success, latencyMs: r.latencyMs });
    todayByComponent.set(r.componentId, arr);
  }

  function todayInMaintenance(componentId: string): boolean {
    return todayMaintenance.some(
      (m) =>
        m.componentId === componentId &&
        m.scheduledFor != null &&
        m.scheduledUntil != null &&
        m.scheduledFor < tomorrow &&
        m.scheduledUntil > today,
    );
  }

  for (const componentId of componentIds) {
    const bars: UptimeBarDay[] = days.map((day) => {
      const dayMs = day.getTime();
      // Today's bar: compute live from raw probes
      if (dayMs === today.getTime()) {
        const results = todayByComponent.get(componentId) ?? [];
        const inMaintenance = todayInMaintenance(componentId);
        if (results.length === 0 && !inMaintenance) {
          return { date: day, state: "unknown", uptimeBp: null, totalChecks: 0 };
        }
        const r = computeDayRollup(results, inMaintenance);
        return {
          date: day,
          state: r.worstStateOnDay,
          uptimeBp: r.totalChecks > 0 ? r.uptimeBp : null,
          totalChecks: r.totalChecks,
        };
      }
      // Historical bar: from rollup
      const rollup = rollupIndex.get(componentId)?.get(dayMs);
      if (!rollup) {
        return { date: day, state: "unknown", uptimeBp: null, totalChecks: 0 };
      }
      return {
        date: day,
        state: rollup.worstStateOnDay,
        uptimeBp: rollup.totalChecks > 0 ? rollup.uptimeBp : null,
        totalChecks: rollup.totalChecks,
      };
    });
    result.set(componentId, bars);
  }

  return result;
}
