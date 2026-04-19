"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/server/auth/session";
import {
  extendTrial,
  changeSubscriptionPlan,
  setCancelAtPeriodEnd,
  refundStripeInvoice,
  type RefundResult,
} from "@/server/admin/billing";
import {
  extendTrialSchema,
  changePlanSchema,
  refundInvoiceSchema,
} from "@/schemas/admin/billing";

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

  await extendTrial(parsed.data.subscriptionId, parsed.data.days, session.user.id);
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

  await changeSubscriptionPlan(parsed.data.subscriptionId, parsed.data.newPlanId, session.user.id);
  revalidatePath("/admin/billing");
  return {};
}

export async function cancelAtPeriodEndAction(
  subscriptionId: string,
  value: boolean,
): Promise<{ error?: string }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  await setCancelAtPeriodEnd(subscriptionId, value, session.user.id);
  revalidatePath("/admin/billing");
  return {};
}

export async function refundInvoiceAction(
  values: unknown,
): Promise<{ error?: string; refund?: RefundResult }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = refundInvoiceSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  try {
    const refund = await refundStripeInvoice(parsed.data.invoiceId, session.user.id, {
      amountCents: parsed.data.amountCents,
      reason: parsed.data.reason,
    });
    revalidatePath("/admin/billing");
    return { refund };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refund failed.";
    return { error: message };
  }
}
