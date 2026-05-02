import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  statusIncidents,
  statusIncidentUpdates,
  statusIncidentComponents,
  statusComponents,
} from "@/db/schema";

export type AdminIncident = typeof statusIncidents.$inferSelect;
export type AdminIncidentUpdate = typeof statusIncidentUpdates.$inferSelect;

export type AdminIncidentSummary = AdminIncident & {
  componentNames: string[];
};

export async function listAdminIncidents(): Promise<AdminIncidentSummary[]> {
  const rows = await db.select().from(statusIncidents).orderBy(desc(statusIncidents.startedAt));

  if (rows.length === 0) return [];

  const links = await db
    .select({
      incidentId: statusIncidentComponents.incidentId,
      componentName: statusComponents.name,
    })
    .from(statusIncidentComponents)
    .innerJoin(statusComponents, eq(statusIncidentComponents.componentId, statusComponents.id));

  const byIncident = new Map<string, string[]>();
  for (const l of links) {
    const arr = byIncident.get(l.incidentId) ?? [];
    arr.push(l.componentName);
    byIncident.set(l.incidentId, arr);
  }

  return rows.map((r) => ({ ...r, componentNames: byIncident.get(r.id) ?? [] }));
}

export type AdminIncidentDetail = {
  incident: AdminIncident;
  updates: AdminIncidentUpdate[];
  componentIds: string[];
};

export async function getAdminIncidentById(id: string): Promise<AdminIncidentDetail | null> {
  const [incident] = await db
    .select()
    .from(statusIncidents)
    .where(eq(statusIncidents.id, id))
    .limit(1);

  if (!incident) return null;

  const [updates, componentLinks] = await Promise.all([
    db
      .select()
      .from(statusIncidentUpdates)
      .where(eq(statusIncidentUpdates.incidentId, id))
      .orderBy(asc(statusIncidentUpdates.createdAt)),
    db
      .select({ componentId: statusIncidentComponents.componentId })
      .from(statusIncidentComponents)
      .where(eq(statusIncidentComponents.incidentId, id)),
  ]);

  return {
    incident,
    updates,
    componentIds: componentLinks.map((c) => c.componentId),
  };
}
