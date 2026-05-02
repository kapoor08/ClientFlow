import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { statusComponents, statusCheckResults } from "@/db/schema";
import { runProbe, type ProbeResult } from "./probe";
import { deriveCurrentState } from "./state";
import { maybeOpenAutoIncident } from "./auto-incident";
import { logger } from "@/server/observability/logger";
import type { ComponentState } from "@/db/schemas/status";

/**
 * Concurrency limit for the per-cycle probe sweep. 5 in-flight HTTP probes
 * at a time keeps total wall-clock low (a 1-min cadence with 7 components
 * runs in ~2 batches) without making the function look like an attacker
 * to upstream rate limits.
 */
const CONCURRENCY = 5;

type ComponentRow = typeof statusComponents.$inferSelect;

export type RunProbesSummary = {
  probed: number;
  errors: number;
  results: Array<{
    componentId: string;
    slug: string;
    success: boolean;
    state: ComponentState;
    latencyMs: number;
    error?: string;
  }>;
};

export async function runAllProbes(): Promise<RunProbesSummary> {
  const components = await db
    .select()
    .from(statusComponents)
    .where(eq(statusComponents.isActive, true));

  let probed = 0;
  let errors = 0;
  const results: RunProbesSummary["results"] = [];

  for (let i = 0; i < components.length; i += CONCURRENCY) {
    const batch = components.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (component) => {
        try {
          const probeResult = await runProbe(component.probeConfig);
          const state = await recordAndDeriveState(component, probeResult);
          probed++;
          results.push({
            componentId: component.id,
            slug: component.slug,
            success: probeResult.success,
            state,
            latencyMs: probeResult.latencyMs,
            error: probeResult.error,
          });
        } catch (err) {
          errors++;
          logger.error("status.probe.unexpected_failure", err, {
            componentId: component.id,
          });
        }
      }),
    );
  }

  return { probed, errors, results };
}

/**
 * Run a single component's probe and persist the result. Used by the
 * "probe now" admin button so an operator can trigger an immediate check
 * during incident investigation.
 */
export async function runSingleProbe(componentId: string): Promise<{
  state: ComponentState;
  result: ProbeResult;
}> {
  const [component] = await db
    .select()
    .from(statusComponents)
    .where(eq(statusComponents.id, componentId))
    .limit(1);

  if (!component) {
    throw new Error(`Status component ${componentId} not found`);
  }

  const probeResult = await runProbe(component.probeConfig);
  const state = await recordAndDeriveState(component, probeResult);
  return { state, result: probeResult };
}

/**
 * Persist the probe result, recompute the cached current state, and (if
 * the new state is `outage` and the component opts in) trigger
 * auto-incident opening.
 *
 * `stateUpdatedAt` is only bumped when the state actually changes - that
 * way it represents "this state began at" instead of "last probe time",
 * which the auto-incident logic uses to compute outage duration.
 */
async function recordAndDeriveState(
  component: ComponentRow,
  probeResult: ProbeResult,
): Promise<ComponentState> {
  const now = new Date();
  await db.insert(statusCheckResults).values({
    id: crypto.randomUUID(),
    componentId: component.id,
    checkedAt: now,
    success: probeResult.success,
    latencyMs: probeResult.latencyMs,
    httpStatus: probeResult.httpStatus ?? null,
    error: probeResult.error ?? null,
  });

  const newState = await deriveCurrentState(component.id);
  const stateChanged = newState !== component.currentState;

  await db
    .update(statusComponents)
    .set({
      currentState: newState,
      // Only mark a new "state began" timestamp when the state actually
      // transitions; otherwise leave it untouched so duration math is honest.
      ...(stateChanged ? { stateUpdatedAt: now } : {}),
      updatedAt: now,
    })
    .where(eq(statusComponents.id, component.id));

  // Auto-incident hook. Skip when not in outage, when feature is disabled,
  // or when stateUpdatedAt is unknown (first-ever probe of a component).
  if (
    newState === "outage" &&
    component.autoOpenIncidentAfterMin != null &&
    component.autoOpenIncidentAfterMin > 0
  ) {
    const outageStartedAt = stateChanged ? now : (component.stateUpdatedAt ?? now);
    await maybeOpenAutoIncident(
      component.id,
      component.name,
      component.slug,
      component.autoOpenIncidentAfterMin,
      outageStartedAt,
    );
  }

  return newState;
}
