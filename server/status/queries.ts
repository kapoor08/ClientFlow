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

/**
 * Month-grouped incident history for the historical /history page. Returns
 * the last `months` UTC months, newest first. Empty months are included so
 * the timeline shows month headers even on quiet stretches (the page
 * renders "No incidents reported for this month" placeholder).
 *
 * Includes both resolved AND active incidents - this is the chronological
 * archive view, not the "what's happening now" banner view, so duplication
 * isn't a concern here.
 */
export async function listIncidentsByMonth(
  months: number,
): Promise<Array<{ year: number; month: number; incidents: PublicIncidentSummary[] }>> {
  const now = new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

  const rows = await db
    .select()
    .from(statusIncidents)
    .where(gte(statusIncidents.startedAt, windowStart))
    .orderBy(desc(statusIncidents.startedAt));

  const enriched = await enrichIncidents(rows);

  // Bucket incidents by their startedAt year+month.
  const byMonth = new Map<string, PublicIncidentSummary[]>();
  for (const inc of enriched) {
    const key = `${inc.startedAt.getUTCFullYear()}-${inc.startedAt.getUTCMonth()}`;
    const arr = byMonth.get(key) ?? [];
    arr.push(inc);
    byMonth.set(key, arr);
  }

  // Build the contiguous month window (newest first → oldest last).
  const result: Array<{ year: number; month: number; incidents: PublicIncidentSummary[] }> = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    result.push({ year, month, incidents: byMonth.get(`${year}-${month}`) ?? [] });
  }
  return result;
}

/**
 * Day-grouped incident history for the public status page's "Past Incidents"
 * section. Returns the last `days` UTC days, oldest day last (so callers can
 * render today first), with each day mapped to the incidents that started on
 * it. Days with no incidents map to an empty array - callers render "No
 * incidents reported" rather than skipping.
 *
 * Filters to resolved incidents only - active incidents have their own
 * banner at the top of the page and would otherwise show up twice.
 */
export async function listIncidentsByDay(
  days: number,
): Promise<Array<{ date: Date; incidents: PublicIncidentSummary[] }>> {
  const DAY_MS = 86_400_000;
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const windowStart = new Date(todayUtc.getTime() - (days - 1) * DAY_MS);

  const rows = await db
    .select()
    .from(statusIncidents)
    .where(and(isNotNull(statusIncidents.resolvedAt), gte(statusIncidents.startedAt, windowStart)))
    .orderBy(desc(statusIncidents.startedAt));

  const enriched = await enrichIncidents(rows);

  // Bucket incidents by their startedAt UTC day.
  const byDay = new Map<number, PublicIncidentSummary[]>();
  for (const inc of enriched) {
    const dayStart = new Date(inc.startedAt);
    dayStart.setUTCHours(0, 0, 0, 0);
    const key = dayStart.getTime();
    const arr = byDay.get(key) ?? [];
    arr.push(inc);
    byDay.set(key, arr);
  }

  // Build the contiguous day window (today first → oldest last) so empty
  // days still render with a "No incidents reported" placeholder.
  const result: Array<{ date: Date; incidents: PublicIncidentSummary[] }> = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(todayUtc.getTime() - i * DAY_MS);
    result.push({ date: day, incidents: byDay.get(day.getTime()) ?? [] });
  }
  return result;
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
