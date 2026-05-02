import "server-only";

import type { ComponentState } from "@/db/schemas/status";
import { CONSECUTIVE_OUTAGE_THRESHOLD } from "@/server/status/state";

/**
 * Pure rollup helpers - exported for unit tests, no DB.
 */

/** Truncate a Date to UTC midnight (00:00:00.000 UTC of the same calendar day). */
export function utcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const DAY_MS = 86_400_000;

export function nextDay(day: Date): Date {
  return new Date(day.getTime() + DAY_MS);
}

/**
 * Per-day rollup math. `resultsChronological` is in time-ascending order so
 * we can detect consecutive-failure clusters (which determine "outage" for
 * the day). `inMaintenance` overrides everything - a maintenance overlay
 * means the day's bar is blue/sky regardless of probe outcomes.
 */
export type DayRollup = {
  totalChecks: number;
  successfulChecks: number;
  /** Uptime in basis points (0-10000). Two decimal precision without floats. */
  uptimeBp: number;
  avgLatencyMs: number | null;
  worstStateOnDay: ComponentState;
};

export function computeDayRollup(
  resultsChronological: ReadonlyArray<{
    success: boolean;
    latencyMs: number | null;
  }>,
  inMaintenance: boolean,
): DayRollup {
  const totalChecks = resultsChronological.length;
  const successfulChecks = resultsChronological.filter((r) => r.success).length;
  const uptimeBp = totalChecks > 0 ? Math.round((successfulChecks / totalChecks) * 10000) : 10000;

  const latencies = resultsChronological
    .map((r) => r.latencyMs)
    .filter((n): n is number => n != null);
  const avgLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

  return {
    totalChecks,
    successfulChecks,
    uptimeBp,
    avgLatencyMs,
    worstStateOnDay: computeWorstStateForDay(resultsChronological, inMaintenance),
  };
}

/**
 * Worst state observed during the day. Different semantics from
 * `deriveStateFromResults` (which looks at the leading edge for the
 * *current* state) - here we walk the whole day and report the worst
 * cluster encountered.
 */
export function computeWorstStateForDay(
  resultsChronological: ReadonlyArray<{ success: boolean }>,
  inMaintenance: boolean,
): ComponentState {
  if (inMaintenance) return "maintenance";
  if (resultsChronological.length === 0) return "unknown";

  let consecutiveFailures = 0;
  let maxConsecutive = 0;
  let totalFailures = 0;
  for (const r of resultsChronological) {
    if (!r.success) {
      consecutiveFailures++;
      totalFailures++;
      if (consecutiveFailures > maxConsecutive) maxConsecutive = consecutiveFailures;
    } else {
      consecutiveFailures = 0;
    }
  }

  if (maxConsecutive >= CONSECUTIVE_OUTAGE_THRESHOLD) return "outage";
  if (totalFailures > 0) return "degraded";
  return "operational";
}
