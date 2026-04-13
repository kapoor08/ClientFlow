import "server-only";

import { and, count, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { plans, planFeatureLimits, planFeatureFlags, subscriptions } from "@/db/schema";
import { PLAN_LIMITS } from "@/config/plan-limits";

export async function getAdminPlansWithLimits() {
  const allPlans = await db.select().from(plans).orderBy(plans.displayOrder, plans.code);
  const allLimits = await db.select().from(planFeatureLimits);
  const allFlags = await db.select().from(planFeatureFlags);

  return allPlans.map((plan) => ({
    ...plan,
    limits: allLimits.filter((l) => l.planId === plan.id),
    flags: allFlags.filter((f) => f.planId === plan.id),
    configLimits: PLAN_LIMITS[plan.code as keyof typeof PLAN_LIMITS] ?? null,
  }));
}

export async function getPlanSubscriberCount(planId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(subscriptions)
    .where(and(eq(subscriptions.planId, planId), eq(subscriptions.status, "active")));
  return row?.total ?? 0;
}

export type PlanInput = {
  name: string;
  description?: string;
  monthlyPriceCents?: number;
  yearlyPriceCents?: number;
  trialDays?: number;
  maxSeats?: number;
  maxProjects?: number;
  maxClients?: number;
  monthlyApiCallsLimit?: number;
  displayOrder?: number;
  recommendedBadge?: string;
};

export async function createPlan(code: string, input: PlanInput) {
  const id = crypto.randomUUID();
  await db.insert(plans).values({
    id,
    code,
    name: input.name,
    description: input.description ?? null,
    monthlyPriceCents: input.monthlyPriceCents ?? null,
    yearlyPriceCents: input.yearlyPriceCents ?? null,
    trialDays: input.trialDays ?? null,
    maxSeats: input.maxSeats ?? null,
    maxProjects: input.maxProjects ?? null,
    maxClients: input.maxClients ?? null,
    monthlyApiCallsLimit: input.monthlyApiCallsLimit ?? null,
    displayOrder: input.displayOrder ?? 0,
    recommendedBadge: input.recommendedBadge ?? null,
    isActive: true,
  });
  return id;
}

export async function updatePlan(planId: string, input: PlanInput) {
  await db
    .update(plans)
    .set({
      name: input.name,
      description: input.description ?? null,
      monthlyPriceCents: input.monthlyPriceCents ?? null,
      yearlyPriceCents: input.yearlyPriceCents ?? null,
      trialDays: input.trialDays ?? null,
      maxSeats: input.maxSeats ?? null,
      maxProjects: input.maxProjects ?? null,
      maxClients: input.maxClients ?? null,
      monthlyApiCallsLimit: input.monthlyApiCallsLimit ?? null,
      displayOrder: input.displayOrder ?? 0,
      recommendedBadge: input.recommendedBadge ?? null,
      updatedAt: new Date(),
    })
    .where(eq(plans.id, planId));
}

export async function togglePlanActive(planId: string, isActive: boolean) {
  await db
    .update(plans)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(plans.id, planId));
}

export async function clonePlan(sourcePlanId: string, newCode: string, newName: string) {
  const [source] = await db.select().from(plans).where(eq(plans.id, sourcePlanId)).limit(1);
  if (!source) throw new Error("Source plan not found.");

  const sourceLimits = await db
    .select()
    .from(planFeatureLimits)
    .where(eq(planFeatureLimits.planId, sourcePlanId));
  const sourceFlags = await db
    .select()
    .from(planFeatureFlags)
    .where(eq(planFeatureFlags.planId, sourcePlanId));

  const newId = crypto.randomUUID();
  await db.insert(plans).values({
    id: newId,
    code: newCode,
    name: newName,
    description: source.description,
    monthlyPriceCents: source.monthlyPriceCents,
    yearlyPriceCents: source.yearlyPriceCents,
    trialDays: source.trialDays,
    maxSeats: source.maxSeats,
    maxProjects: source.maxProjects,
    maxClients: source.maxClients,
    monthlyApiCallsLimit: source.monthlyApiCallsLimit,
    displayOrder: source.displayOrder,
    recommendedBadge: null,
    isActive: false,
  });

  if (sourceLimits.length > 0) {
    await db.insert(planFeatureLimits).values(
      sourceLimits.map((l) => ({
        id: crypto.randomUUID(),
        planId: newId,
        featureKey: l.featureKey,
        limitValue: l.limitValue,
      })),
    );
  }
  if (sourceFlags.length > 0) {
    await db.insert(planFeatureFlags).values(
      sourceFlags.map((f) => ({
        id: crypto.randomUUID(),
        planId: newId,
        featureKey: f.featureKey,
        isEnabled: f.isEnabled,
      })),
    );
  }

  return newId;
}
