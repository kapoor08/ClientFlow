"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { statusIncidents, statusIncidentUpdates, statusIncidentComponents } from "@/db/schema";
import { getServerSession } from "@/server/auth/session";
import {
  createIncidentSchema,
  addUpdateSchema,
  resolveIncidentSchema,
  updateIncidentMetaSchema,
  type CreateIncidentValues,
  type AddUpdateValues,
  type ResolveIncidentValues,
  type UpdateIncidentMetaValues,
} from "@/schemas/admin/status-incidents";
import { dispatchIncidentEmails } from "@/server/status/notifications";

async function requirePlatformAdmin(): Promise<{ userId: string }> {
  const session = await getServerSession();
  if (!session?.user?.isPlatformAdmin) {
    throw new Error("Forbidden");
  }
  return { userId: session.user.id };
}

function revalidateAll(slug?: string): void {
  revalidatePath("/admin/status/incidents");
  revalidatePath("/status");
  if (slug) revalidatePath(`/status/incidents/${slug}`);
}

/**
 * Slugify the title at create time. Strips non-ASCII, collapses whitespace,
 * truncates, then appends a short ULID-ish suffix for uniqueness so two
 * incidents with the same title don't collide.
 */
function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = crypto.randomUUID().slice(0, 6);
  return base ? `${base}-${suffix}` : suffix;
}

export async function createIncidentAction(
  input: CreateIncidentValues,
): Promise<{ id?: string; slug?: string; error?: string }> {
  try {
    const { userId } = await requirePlatformAdmin();
    const parsed = createIncidentSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const data = parsed.data;
    const id = crypto.randomUUID();
    const slug = slugify(data.title);
    const now = new Date();

    await db.batch([
      db.insert(statusIncidents).values({
        id,
        slug,
        title: data.title,
        startedAt: now,
        currentState: data.initialState,
        impact: data.impact,
        isScheduled: data.isScheduled,
        scheduledFor: data.scheduledFor ?? null,
        scheduledUntil: data.scheduledUntil ?? null,
        postedByUserId: userId,
        isAutoOpened: false,
      }),
      db.insert(statusIncidentUpdates).values({
        id: crypto.randomUUID(),
        incidentId: id,
        body: data.initialBody,
        stateAtPost: data.initialState,
        postedByUserId: userId,
      }),
      // P3-2: single multi-row insert instead of one statement per component.
      ...(data.componentIds.length > 0
        ? [
            db
              .insert(statusIncidentComponents)
              .values(data.componentIds.map((componentId) => ({ incidentId: id, componentId }))),
          ]
        : []),
    ]);

    revalidateAll(slug);
    void dispatchIncidentEmails({
      incidentId: id,
      kind: data.isScheduled ? "scheduled" : "opened",
      updateBody: data.initialBody,
    });
    return { id, slug };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to open incident",
    };
  }
}

export async function addIncidentUpdateAction(
  incidentId: string,
  input: AddUpdateValues,
): Promise<{ error?: string }> {
  try {
    const { userId } = await requirePlatformAdmin();
    const parsed = addUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const now = new Date();

    const [incident] = await db
      .select({ slug: statusIncidents.slug, resolvedAt: statusIncidents.resolvedAt })
      .from(statusIncidents)
      .where(eq(statusIncidents.id, incidentId))
      .limit(1);
    if (!incident) return { error: "Incident not found" };
    if (incident.resolvedAt) {
      return { error: "Incident is already resolved" };
    }

    await db.batch([
      db.insert(statusIncidentUpdates).values({
        id: crypto.randomUUID(),
        incidentId,
        body: parsed.data.body,
        stateAtPost: parsed.data.stateAtPost,
        postedByUserId: userId,
      }),
      db
        .update(statusIncidents)
        .set({ currentState: parsed.data.stateAtPost, updatedAt: now })
        .where(eq(statusIncidents.id, incidentId)),
    ]);

    revalidateAll(incident.slug);
    void dispatchIncidentEmails({
      incidentId,
      kind: "updated",
      updateBody: parsed.data.body,
    });
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to post update",
    };
  }
}

export async function resolveIncidentAction(
  incidentId: string,
  input: ResolveIncidentValues = {},
): Promise<{ error?: string }> {
  try {
    const { userId } = await requirePlatformAdmin();
    const parsed = resolveIncidentSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const body =
      parsed.data.body && parsed.data.body.trim().length > 0
        ? parsed.data.body
        : "Issue has been resolved.";

    const [incident] = await db
      .select({ slug: statusIncidents.slug, resolvedAt: statusIncidents.resolvedAt })
      .from(statusIncidents)
      .where(eq(statusIncidents.id, incidentId))
      .limit(1);
    if (!incident) return { error: "Incident not found" };
    if (incident.resolvedAt) return { error: "Already resolved" };

    const now = new Date();
    await db.batch([
      db.insert(statusIncidentUpdates).values({
        id: crypto.randomUUID(),
        incidentId,
        body,
        stateAtPost: "resolved",
        postedByUserId: userId,
      }),
      db
        .update(statusIncidents)
        .set({ currentState: "resolved", resolvedAt: now, updatedAt: now })
        .where(eq(statusIncidents.id, incidentId)),
    ]);

    revalidateAll(incident.slug);
    void dispatchIncidentEmails({
      incidentId,
      kind: "resolved",
      updateBody: body,
    });
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to resolve incident",
    };
  }
}

export async function updateIncidentMetaAction(
  incidentId: string,
  input: UpdateIncidentMetaValues,
): Promise<{ error?: string }> {
  try {
    await requirePlatformAdmin();
    const parsed = updateIncidentMetaSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const [incident] = await db
      .select({ slug: statusIncidents.slug })
      .from(statusIncidents)
      .where(eq(statusIncidents.id, incidentId))
      .limit(1);
    if (!incident) return { error: "Incident not found" };

    await db.batch([
      db
        .update(statusIncidents)
        .set({
          title: parsed.data.title,
          impact: parsed.data.impact,
          updatedAt: new Date(),
        })
        .where(eq(statusIncidents.id, incidentId)),
      db
        .delete(statusIncidentComponents)
        .where(eq(statusIncidentComponents.incidentId, incidentId)),
      // P3-2: single multi-row insert instead of one statement per component.
      ...(parsed.data.componentIds.length > 0
        ? [
            db
              .insert(statusIncidentComponents)
              .values(parsed.data.componentIds.map((componentId) => ({ incidentId, componentId }))),
          ]
        : []),
    ]);

    revalidateAll(incident.slug);
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update incident",
    };
  }
}

export async function deleteIncidentAction(incidentId: string): Promise<{ error?: string }> {
  try {
    await requirePlatformAdmin();
    // FK cascades drop updates + component links automatically.
    await db.delete(statusIncidents).where(eq(statusIncidents.id, incidentId));
    revalidateAll();
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete incident",
    };
  }
}
