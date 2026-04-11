import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  subscriptions,
  organizationCurrentSubscriptions,
  plans,
} from "@/db/schema";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";

export type SubscriptionContext = {
  planCode: string;
  roleKey: string | null;
  status: string;
  trialEndsAt: Date | null;
  daysLeftInTrial: number | null;
  isTrialing: boolean;
  isActive: boolean;
  isTrialExpired: boolean;
  hasAccess: boolean;
};

export async function getSubscriptionContextForUser(
  userId: string,
): Promise<SubscriptionContext | null> {
  const orgContext = await getOrganizationSettingsContextForUser(userId);
  if (!orgContext) return null;

  const [row] = await db
    .select({
      status: subscriptions.status,
      trialEndsAt: subscriptions.trialEndsAt,
      planCode: plans.code,
    })
    .from(organizationCurrentSubscriptions)
    .innerJoin(
      subscriptions,
      eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id),
    )
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      eq(organizationCurrentSubscriptions.organizationId, orgContext.organizationId),
    )
    .limit(1);

  if (!row) return null;

  const now = new Date();
  const isTrialing = row.status === "trialing";
  const isActive = row.status === "active";
  const trialEndsAt = row.trialEndsAt;
  const isTrialExpired =
    isTrialing && trialEndsAt !== null && trialEndsAt < now;

  // Paid plans (non-free) are managed by Stripe - trust Stripe's status.
  // Stripe transitions "trialing" → "active" (paid) or "past_due" (failed).
  // Only enforce our own trial expiry for the free plan soft-trial.
  const isPaidPlan = row.planCode !== "free";
  const hasAccess = isActive || (isTrialing && (isPaidPlan || !isTrialExpired));

  let daysLeftInTrial: number | null = null;
  if (isTrialing && trialEndsAt && !isTrialExpired) {
    daysLeftInTrial = Math.ceil(
      (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  return {
    planCode: row.planCode,
    roleKey: orgContext.roleKey,
    status: row.status,
    trialEndsAt,
    daysLeftInTrial,
    isTrialing,
    isActive,
    isTrialExpired,
    hasAccess,
  };
}
