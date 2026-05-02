import "server-only";

import { and, asc, desc, eq, gte, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  statusComponents,
  statusIncidents,
  statusIncidentUpdates,
  statusIncidentComponents,
} from "@/db/schema";
import type { ComponentState, IncidentImpact, IncidentState } from "@/db/schemas/status";

export type PublicComponent = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  currentState: ComponentState;
  stateUpdatedAt: Date | null;
};

/**
 * All active components in display order, with the cached currentState the
 * prober wrote on the last cycle. The public status page renders directly
 * from this; no recomputation on the read path.
 */
export async function listActiveComponents(): Promise<PublicComponent[]> {
  return db
    .select({
      id: statusComponents.id,
      slug: statusComponents.slug,
      name: statusComponents.name,
      description: statusComponents.description,
      currentState: statusComponents.currentState,
      stateUpdatedAt: statusComponents.stateUpdatedAt,
    })
    .from(statusComponents)
    .where(eq(statusComponents.isActive, true))
    .orderBy(asc(statusComponents.displayOrder), asc(statusComponents.name));
}

/**
 * Banner state for the page header. Order of severity: outage trumps
 * degraded trumps maintenance trumps operational. `unknown` is treated as
 * operational for the banner so a freshly-added component doesn't scare
 * users with a yellow flag.
 */
export type BannerState = "operational" | "degraded" | "outage" | "maintenance";

export function deriveBannerState(components: PublicComponent[]): BannerState {
  const states = components.map((c) => c.currentState);
  if (states.includes("outage")) return "outage";
  if (states.includes("degraded")) return "degraded";
  if (states.includes("maintenance")) return "maintenance";
  return "operational";
}

/**
 * Most recent state-update timestamp across all components - used as the
 * "last updated" footer line. Returns null when no components have been
 * probed yet.
 */
export function latestStateUpdate(components: PublicComponent[]): Date | null {
  let latest: Date | null = null;
  for (const c of components) {
    if (!c.stateUpdatedAt) continue;
    if (!latest || c.stateUpdatedAt > latest) latest = c.stateUpdatedAt;
  }
  return latest;
}

// ─── Public incident queries ──────────────────────────────────────────────────

export type PublicIncidentSummary = {
  id: string;
  slug: string;
  title: string;
  startedAt: Date;
  resolvedAt: Date | null;
  currentState: IncidentState;
  impact: IncidentImpact;
  isScheduled: boolean;
  scheduledFor: Date | null;
  scheduledUntil: Date | null;
  affectedComponentNames: string[];
  latestUpdateBody: string | null;
};

export type PublicIncidentDetail = PublicIncidentSummary & {
  updates: Array<{
    id: string;
    body: string;
    stateAtPost: IncidentState;
    createdAt: Date;
  }>;
};

const RECENT_INCIDENT_LOOKBACK_DAYS = 30;

/**
 * Currently-open incidents: anything not yet resolved. Sorted by impact
 * (worst first) so an active critical outage sits above a minor scheduled
 * maintenance banner.
 */
export async function listActiveIncidents(): Promise<PublicIncidentSummary[]> {
  const rows = await db
    .select()
    .from(statusIncidents)
    .where(isNull(statusIncidents.resolvedAt))
    .orderBy(desc(statusIncidents.startedAt));
  return enrichIncidents(rows);
}

/**
 * Recent resolved incidents - the "history" section. 30-day lookback
 * matches the 90-day uptime-bar window without overwhelming the page.
 */
export async function listRecentResolvedIncidents(): Promise<PublicIncidentSummary[]> {
  const since = new Date(Date.now() - RECENT_INCIDENT_LOOKBACK_DAYS * 86_400_000);
  const rows = await db
    .select()
    .from(statusIncidents)
    .where(and(isNotNull(statusIncidents.resolvedAt), gte(statusIncidents.resolvedAt, since)))
    .orderBy(desc(statusIncidents.resolvedAt));
  return enrichIncidents(rows);
}

export async function getIncidentBySlug(slug: string): Promise<PublicIncidentDetail | null> {
  const [row] = await db
    .select()
    .from(statusIncidents)
    .where(eq(statusIncidents.slug, slug))
    .limit(1);
  if (!row) return null;

  const [enriched] = await enrichIncidents([row]);
  if (!enriched) return null;

  const updates = await db
    .select({
      id: statusIncidentUpdates.id,
      body: statusIncidentUpdates.body,
      stateAtPost: statusIncidentUpdates.stateAtPost,
      createdAt: statusIncidentUpdates.createdAt,
    })
    .from(statusIncidentUpdates)
    .where(eq(statusIncidentUpdates.incidentId, row.id))
    .orderBy(desc(statusIncidentUpdates.createdAt));

  return { ...enriched, updates };
}

async function enrichIncidents(
  rows: Array<typeof statusIncidents.$inferSelect>,
): Promise<PublicIncidentSummary[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  // One round-trip per category; in practice these tables are small enough
  // that a JOIN-and-group-in-SQL would be overkill.
  const [componentLinks, latestUpdates] = await Promise.all([
    db
      .select({
        incidentId: statusIncidentComponents.incidentId,
        name: statusComponents.name,
      })
      .from(statusIncidentComponents)
      .innerJoin(statusComponents, eq(statusIncidentComponents.componentId, statusComponents.id))
      .where(or(...ids.map((id) => eq(statusIncidentComponents.incidentId, id)))),
    db
      .select({
        incidentId: statusIncidentUpdates.incidentId,
        body: statusIncidentUpdates.body,
        createdAt: statusIncidentUpdates.createdAt,
      })
      .from(statusIncidentUpdates)
      .where(or(...ids.map((id) => eq(statusIncidentUpdates.incidentId, id))))
      .orderBy(desc(statusIncidentUpdates.createdAt)),
  ]);

  const namesByIncident = new Map<string, string[]>();
  for (const link of componentLinks) {
    const arr = namesByIncident.get(link.incidentId) ?? [];
    arr.push(link.name);
    namesByIncident.set(link.incidentId, arr);
  }

  // First-encountered = latest because the SELECT was orderBy desc.
  const latestByIncident = new Map<string, string>();
  for (const u of latestUpdates) {
    if (!latestByIncident.has(u.incidentId)) {
      latestByIncident.set(u.incidentId, u.body);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    startedAt: r.startedAt!,
    resolvedAt: r.resolvedAt,
    currentState: r.currentState,
    impact: r.impact,
    isScheduled: r.isScheduled,
    scheduledFor: r.scheduledFor,
    scheduledUntil: r.scheduledUntil,
    affectedComponentNames: namesByIncident.get(r.id) ?? [],
    latestUpdateBody: latestByIncident.get(r.id) ?? null,
  }));
}
