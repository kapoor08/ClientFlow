"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { statusComponents } from "@/db/schema";
import { getServerSession } from "@/server/auth/session";
import { componentFormSchema, type ComponentFormValues } from "@/schemas/admin/status-components";

/**
 * All admin actions in this file:
 *   - require platform-admin session
 *   - validate input via Zod
 *   - revalidate both the admin page and the public status page so cached
 *     ISR + cached `currentState` reflect the change immediately
 *   - return `{ error?: string }` shaped responses (matches the existing
 *     plans/actions convention)
 */

async function requirePlatformAdmin(): Promise<void> {
  const session = await getServerSession();
  if (!session?.user?.isPlatformAdmin) {
    throw new Error("Forbidden");
  }
}

function revalidateStatusPaths(): void {
  revalidatePath("/admin/status/components");
  revalidatePath("/status");
}

export async function createComponentAction(
  input: ComponentFormValues,
): Promise<{ id?: string; error?: string }> {
  try {
    await requirePlatformAdmin();
    const parsed = componentFormSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const id = crypto.randomUUID();
    await db.insert(statusComponents).values({
      id,
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      probeConfig: parsed.data.probeConfig,
      autoOpenIncidentAfterMin: parsed.data.autoOpenIncidentAfterMin ?? null,
      displayOrder: parsed.data.displayOrder,
      isActive: parsed.data.isActive,
    });
    revalidateStatusPaths();
    return { id };
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message === "Forbidden"
          ? "Forbidden"
          : err instanceof Error
            ? err.message
            : "Failed to create component",
    };
  }
}

export async function updateComponentAction(
  id: string,
  input: ComponentFormValues,
): Promise<{ error?: string }> {
  try {
    await requirePlatformAdmin();
    const parsed = componentFormSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await db
      .update(statusComponents)
      .set({
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        probeConfig: parsed.data.probeConfig,
        autoOpenIncidentAfterMin: parsed.data.autoOpenIncidentAfterMin ?? null,
        displayOrder: parsed.data.displayOrder,
        isActive: parsed.data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(statusComponents.id, id));
    revalidateStatusPaths();
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update component",
    };
  }
}

export async function toggleComponentActiveAction(
  id: string,
  isActive: boolean,
): Promise<{ error?: string }> {
  try {
    await requirePlatformAdmin();
    await db
      .update(statusComponents)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(statusComponents.id, id));
    revalidateStatusPaths();
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to toggle component",
    };
  }
}

export async function deleteComponentAction(id: string): Promise<{ error?: string }> {
  try {
    await requirePlatformAdmin();
    // FK cascades drop status_check_results, status_check_daily_rollups, and
    // status_incident_components rows automatically (see schema).
    await db.delete(statusComponents).where(eq(statusComponents.id, id));
    revalidateStatusPaths();
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete component",
    };
  }
}

/**
 * Move a component up or down in display order by re-numbering ALL rows
 * to a clean 0..N-1 sequence after the swap. Cheap (handful of rows),
 * avoids the "everyone has displayOrder=0" corner case where naive swaps
 * are no-ops.
 */
export async function moveComponentAction(
  id: string,
  direction: "up" | "down",
): Promise<{ error?: string }> {
  try {
    await requirePlatformAdmin();
    const all = await db
      .select({ id: statusComponents.id })
      .from(statusComponents)
      .orderBy(asc(statusComponents.displayOrder), asc(statusComponents.name));

    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return { error: "Component not found" };

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= all.length) return {}; // already at edge

    const reordered = [...all];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

    await db.transaction(async (tx) => {
      const now = new Date();
      for (let i = 0; i < reordered.length; i++) {
        await tx
          .update(statusComponents)
          .set({ displayOrder: i, updatedAt: now })
          .where(eq(statusComponents.id, reordered[i].id));
      }
    });

    revalidateStatusPaths();
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to reorder",
    };
  }
}
