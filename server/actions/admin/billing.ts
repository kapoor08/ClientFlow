"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/server/auth/session";
import {
  extendTrial,
  changeSubscriptionPlan,
  setCancelAtPeriodEnd,
} from "@/server/admin/billing";
import { extendTrialSchema, changePlanSchema } from "@/schemas/admin/billing";

function unauthorized() {
  return { error: "Unauthorized." };
}

async function requirePlatformAdmin() {
  const session = await getServerSession();
  if (!session?.user?.isPlatformAdmin) return null;
  return session;
}

export async function extendTrialAction(
  values: unknown,
): Promise<{ error?: string }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = extendTrialSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await extendTrial(parsed.data.subscriptionId, parsed.data.days);
  revalidatePath("/admin/billing");
  return {};
}

export async function changePlanAction(
  values: unknown,
): Promise<{ error?: string }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = changePlanSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await changeSubscriptionPlan(parsed.data.subscriptionId, parsed.data.newPlanId);
  revalidatePath("/admin/billing");
  return {};
}

export async function cancelAtPeriodEndAction(
  subscriptionId: string,
  value: boolean,
): Promise<{ error?: string }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  await setCancelAtPeriodEnd(subscriptionId, value);
  revalidatePath("/admin/billing");
  return {};
}
