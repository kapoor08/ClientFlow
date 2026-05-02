import "server-only";

import { asc } from "drizzle-orm";
import { db } from "@/server/db/client";
import { statusComponents } from "@/db/schema";

export type AdminStatusComponent = typeof statusComponents.$inferSelect;

/**
 * Admin-side component list. Includes inactive rows (the public page hides
 * them) so an operator can re-enable retired components without re-creating
 * them from scratch.
 */
export async function listAdminComponents(): Promise<AdminStatusComponent[]> {
  return db
    .select()
    .from(statusComponents)
    .orderBy(asc(statusComponents.displayOrder), asc(statusComponents.name));
}
