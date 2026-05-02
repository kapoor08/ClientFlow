import "server-only";

import { and, asc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  statusCheckDailyRollups,
  statusCheckResults,
  statusComponents,
  statusIncidentComponents,
  statusIncidents,
} from "@/db/schema";
import { computeDayRollup, nextDay, utcDayStart } from "@/server/status/rollup";
import { logger } from "@/server/observability/logger";

const ROLLUP_LOOKBACK_DAYS = 90;
/** Raw-results retention. Daily rollups preserve the visualization data. */
const RAW_RESULTS_RETENTION_DAYS = 90;

const DAY_MS = 86_400_000;

export type RunRollupSummary = {
  daysProcessed: number;
  componentsProcessed: number;
  rollupsWritten: number;
  rawRowsPruned: number;
};

/**
 * Daily rollup orchestrator.
 *
 * Each run:
 *   1. Fetch all active components.
 *   2. Fetch all raw probe results from the last 90 days in one query.
 *   3. Fetch all maintenance windows that intersect the 90-day range.
 *   4. Bucket results by (component, UTC day) and roll up in JS.
 *   5. Bulk upsert into `status_check_daily_rollups` (single statement).
 *   6. Prune raw `status_check_results` older than 90 days.
 *
 * Idempotent: the unique index on (component_id, date) lets us re-roll
 * every day every run via ON CONFLICT DO UPDATE. Total round-trips:
 * 4 (read components, read raw, read maintenance, write rollups) + 1 prune.
 */
export async function runDailyRollup(): Promise<RunRollupSummary> {
  const today = utcDayStart(new Date());
  const windowStart = new Date(today.getTime() - ROLLUP_LOOKBACK_DAYS * DAY_MS);

  const components = await db.select({ id: statusComponents.id }).from(statusComponents);

  if (components.length === 0) {
    return { daysProcessed: 0, componentsProcessed: 0, rollupsWritten: 0, rawRowsPruned: 0 };
  }

  // ── Bucket raw results by (componentId, dayStart) ──────────────────────
  const rawResults = await db
    .select({
      componentId: statusCheckResults.componentId,
      success: statusCheckResults.success,
      latencyMs: statusCheckResults.latencyMs,
      checkedAt: statusCheckResults.checkedAt,
    })
    .from(statusCheckResults)
    .where(
      and(gte(statusCheckResults.checkedAt, windowStart), lt(statusCheckResults.checkedAt, today)),
    )
    .orderBy(asc(statusCheckResults.checkedAt));

  const buckets = new Map<
    string,
    Map<number, Array<{ success: boolean; latencyMs: number | null }>>
  >();
  for (const r of rawResults) {
    const dayStart = utcDayStart(r.checkedAt);
    const inner = buckets.get(r.componentId) ?? new Map();
    const dayKey = dayStart.getTime();
    const arr = inner.get(dayKey) ?? [];
    arr.push({ success: r.success, latencyMs: r.latencyMs });
    inner.set(dayKey, arr);
    buckets.set(r.componentId, inner);
  }

  // ── Maintenance overlap lookup ─────────────────────────────────────────
  const maintenanceLinks = await db
    .select({
      componentId: statusIncidentComponents.componentId,
      scheduledFor: statusIncidents.scheduledFor,
      scheduledUntil: statusIncidents.scheduledUntil,
    })
    .from(statusIncidents)
    .innerJoin(
      statusIncidentComponents,
      eq(statusIncidentComponents.incidentId, statusIncidents.id),
    )
    .where(
      and(
        eq(statusIncidents.isScheduled, true),
        // Window touches the rollup range
        lte(statusIncidents.scheduledFor, today),
        gte(statusIncidents.scheduledUntil, windowStart),
      ),
    );

  function dayInMaintenance(componentId: string, dayStart: Date): boolean {
    const dayEnd = nextDay(dayStart);
    return maintenanceLinks.some(
      (m) =>
        m.componentId === componentId &&
        m.scheduledFor != null &&
        m.scheduledUntil != null &&
        m.scheduledFor < dayEnd &&
        m.scheduledUntil > dayStart,
    );
  }

  // ── Build all rollup rows ───────────────────────────────────────────────
  type RollupRow = typeof statusCheckDailyRollups.$inferInsert;
  const rollupRows: RollupRow[] = [];

  // Iterate every day in the lookback window for every component. Skip
  // (component, day) pairs with no data AND no maintenance - we don't
  // store empty rollups; the page will treat absent rows as "no data".
  for (let offset = ROLLUP_LOOKBACK_DAYS; offset >= 1; offset--) {
    const dayStart = new Date(today.getTime() - offset * DAY_MS);
    for (const c of components) {
      const dayResults = buckets.get(c.id)?.get(dayStart.getTime()) ?? [];
      const inMaintenance = dayInMaintenance(c.id, dayStart);
      if (dayResults.length === 0 && !inMaintenance) continue;

      const r = computeDayRollup(dayResults, inMaintenance);
      rollupRows.push({
        id: crypto.randomUUID(),
        componentId: c.id,
        date: dayStart,
        totalChecks: r.totalChecks,
        successfulChecks: r.successfulChecks,
        uptimeBp: r.uptimeBp,
        avgLatencyMs: r.avgLatencyMs,
        worstStateOnDay: r.worstStateOnDay,
      });
    }
  }

  let rollupsWritten = 0;
  if (rollupRows.length > 0) {
    // Postgres `excluded.<col>` references the value the conflicting INSERT
    // tried to place; lets the DO UPDATE branch pick up the just-computed
    // values without re-binding parameters.
    await db
      .insert(statusCheckDailyRollups)
      .values(rollupRows)
      .onConflictDoUpdate({
        target: [statusCheckDailyRollups.componentId, statusCheckDailyRollups.date],
        set: {
          totalChecks: sql`excluded.total_checks`,
          successfulChecks: sql`excluded.successful_checks`,
          uptimeBp: sql`excluded.uptime_bp`,
          avgLatencyMs: sql`excluded.avg_latency_ms`,
          worstStateOnDay: sql`excluded.worst_state_on_day`,
          updatedAt: sql`now()`,
        },
      });
    rollupsWritten = rollupRows.length;
  }

  // ── Prune ───────────────────────────────────────────────────────────────
  const pruneCutoff = new Date(Date.now() - RAW_RESULTS_RETENTION_DAYS * DAY_MS);
  const prunedRows = await db
    .delete(statusCheckResults)
    .where(lt(statusCheckResults.checkedAt, pruneCutoff))
    .returning({ id: statusCheckResults.id });

  logger.info("status.daily_rollup.completed", {
    daysProcessed: ROLLUP_LOOKBACK_DAYS,
    componentsProcessed: components.length,
    rollupsWritten,
    rawRowsPruned: prunedRows.length,
  });

  return {
    daysProcessed: ROLLUP_LOOKBACK_DAYS,
    componentsProcessed: components.length,
    rollupsWritten,
    rawRowsPruned: prunedRows.length,
  };
}
