"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/server/auth/session";
import {
  createPlan,
  updatePlan,
  togglePlanActive,
  clonePlan,
} from "@/server/admin/plans";
import { createPlanSchema, planFormSchema, clonePlanSchema } from "@/schemas/admin/plans";

function unauthorized() {
  return { error: "Unauthorized." };
}

async function requirePlatformAdmin() {
  const session = await getServerSession();
  if (!session?.user?.isPlatformAdmin) return null;
  return session;
}

export async function createPlanAction(
  values: unknown,
): Promise<{ error?: string; id?: string }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = createPlanSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { code, ...input } = parsed.data;
  const id = await createPlan(code, input, session.user.id);
  revalidatePath("/admin/plans");
  return { id };
}

export async function updatePlanAction(
  planId: string,
  values: unknown,
): Promise<{ error?: string }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = planFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await updatePlan(planId, parsed.data, session.user.id);
  revalidatePath("/admin/plans");
  return {};
}

export async function togglePlanActiveAction(
  planId: string,
  isActive: boolean,
): Promise<{ error?: string }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  await togglePlanActive(planId, isActive, session.user.id);
  revalidatePath("/admin/plans");
  return {};
}

export async function clonePlanAction(
  values: unknown,
): Promise<{ error?: string; id?: string }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = clonePlanSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const id = await clonePlan(
    parsed.data.sourcePlanId,
    parsed.data.code,
    parsed.data.name,
    session.user.id,
  );
  revalidatePath("/admin/plans");
  return { id };
}
