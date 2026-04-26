import "server-only";

import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { plans, planFeatureLimits, subscriptions, platformAdminActions } from "@/db/schema";
import { PLAN_LIMITS } from "@/config/plan-limits";
import {
  createStripeProductAndPrices,
  updateStripeProductMeta,
  rotateStripePrice,
  archiveStripePrice,
  setStripeProductActive,
} from "@/server/third-party/stripe";

async function logPlanAction(opts: {
  adminUserId: string;
  action: string;
  planId: string;
  afterSnapshot: Record<string, unknown>;
}) {
  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: opts.adminUserId,
    action: opts.action,
    entityType: "plan",
    entityId: opts.planId,
    organizationId: null,
    afterSnapshot: opts.afterSnapshot,
  });
}

export async function getAdminPlansWithLimits() {
  const allPlans = await db.select().from(plans).orderBy(plans.displayOrder, plans.code);
  const allLimits = await db.select().from(planFeatureLimits);

  return allPlans.map((plan) => ({
    ...plan,
    limits: allLimits.filter((l) => l.planId === plan.id),
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
  features?: string[];
  currencyCode?: string;
};

export async function createPlan(code: string, input: PlanInput, adminUserId: string) {
  const id = crypto.randomUUID();
  const currencyCode = (input.currencyCode ?? "USD").toUpperCase();

  await db.insert(plans).values({
    id,
    code,
    name: input.name,
    description: input.description ?? null,
    currencyCode,
    monthlyPriceCents: input.monthlyPriceCents ?? null,
    yearlyPriceCents: input.yearlyPriceCents ?? null,
    trialDays: input.trialDays ?? null,
    maxSeats: input.maxSeats ?? null,
    maxProjects: input.maxProjects ?? null,
    maxClients: input.maxClients ?? null,
    monthlyApiCallsLimit: input.monthlyApiCallsLimit ?? null,
    displayOrder: input.displayOrder ?? 0,
    recommendedBadge: input.recommendedBadge ?? null,
    features: input.features ?? null,
    isActive: true,
  });

  const stripeResult = await createStripeProductAndPrices({
    code,
    name: input.name,
    description: input.description ?? null,
    currencyCode,
    monthlyPriceCents: input.monthlyPriceCents ?? null,
    yearlyPriceCents: input.yearlyPriceCents ?? null,
  });

  if (stripeResult) {
    await db
      .update(plans)
      .set({
        stripeProductId: stripeResult.productId,
        stripeMonthlyPriceId: stripeResult.monthlyPriceId,
        stripeYearlyPriceId: stripeResult.yearlyPriceId,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, id));
  }

  await logPlanAction({
    adminUserId,
    action: "create_plan",
    planId: id,
    afterSnapshot: {
      code,
      name: input.name,
      monthlyPriceCents: input.monthlyPriceCents ?? null,
      yearlyPriceCents: input.yearlyPriceCents ?? null,
      stripeProductId: stripeResult?.productId ?? null,
    },
  });

  return id;
}

export async function updatePlan(planId: string, input: PlanInput, adminUserId: string) {
  const [existing] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!existing) throw new Error("Plan not found.");

  const currencyCode = (input.currencyCode ?? existing.currencyCode ?? "USD").toUpperCase();

  // Detect price changes that require a new Stripe Price (Prices are immutable).
  const monthlyChanged = (input.monthlyPriceCents ?? null) !== (existing.monthlyPriceCents ?? null);
  const yearlyChanged = (input.yearlyPriceCents ?? null) !== (existing.yearlyPriceCents ?? null);

  let newMonthlyPriceId: string | null | undefined = existing.stripeMonthlyPriceId;
  let newYearlyPriceId: string | null | undefined = existing.stripeYearlyPriceId;

  if (existing.stripeProductId) {
    // Product metadata (name/description) is mutable.
    await updateStripeProductMeta(existing.stripeProductId, {
      name: input.name,
      description: input.description ?? null,
    });

    if (monthlyChanged) {
      if (input.monthlyPriceCents != null && input.monthlyPriceCents > 0) {
        const rotated = await rotateStripePrice({
          productId: existing.stripeProductId,
          oldPriceId: existing.stripeMonthlyPriceId,
          amountCents: input.monthlyPriceCents,
          currencyCode,
          interval: "month",
          planCode: existing.code,
        });
        if (rotated) newMonthlyPriceId = rotated;
      } else {
        if (existing.stripeMonthlyPriceId) {
          await archiveStripePrice(existing.stripeMonthlyPriceId);
        }
        newMonthlyPriceId = null;
      }
    }

    if (yearlyChanged) {
      if (input.yearlyPriceCents != null && input.yearlyPriceCents > 0) {
        const rotated = await rotateStripePrice({
          productId: existing.stripeProductId,
          oldPriceId: existing.stripeYearlyPriceId,
          amountCents: input.yearlyPriceCents,
          currencyCode,
          interval: "year",
          planCode: existing.code,
        });
        if (rotated) newYearlyPriceId = rotated;
      } else {
        if (existing.stripeYearlyPriceId) {
          await archiveStripePrice(existing.stripeYearlyPriceId);
        }
        newYearlyPriceId = null;
      }
    }
  }

  await db
    .update(plans)
    .set({
      name: input.name,
      description: input.description ?? null,
      currencyCode,
      monthlyPriceCents: input.monthlyPriceCents ?? null,
      yearlyPriceCents: input.yearlyPriceCents ?? null,
      trialDays: input.trialDays ?? null,
      maxSeats: input.maxSeats ?? null,
      maxProjects: input.maxProjects ?? null,
      maxClients: input.maxClients ?? null,
      monthlyApiCallsLimit: input.monthlyApiCallsLimit ?? null,
      displayOrder: input.displayOrder ?? 0,
      recommendedBadge: input.recommendedBadge ?? null,
      features: input.features ?? null,
      stripeMonthlyPriceId: newMonthlyPriceId,
      stripeYearlyPriceId: newYearlyPriceId,
      updatedAt: new Date(),
    })
    .where(eq(plans.id, planId));

  await logPlanAction({
    adminUserId,
    action: "update_plan",
    planId,
    afterSnapshot: {
      name: input.name,
      monthlyPriceCents: input.monthlyPriceCents ?? null,
      yearlyPriceCents: input.yearlyPriceCents ?? null,
      monthlyChanged,
      yearlyChanged,
    },
  });
}

export async function togglePlanActive(planId: string, isActive: boolean, adminUserId: string) {
  const [existing] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!existing) throw new Error("Plan not found.");

  await db.update(plans).set({ isActive, updatedAt: new Date() }).where(eq(plans.id, planId));

  if (existing.stripeProductId) {
    await setStripeProductActive(existing.stripeProductId, isActive);
  }

  await logPlanAction({
    adminUserId,
    action: isActive ? "activate_plan" : "deactivate_plan",
    planId,
    afterSnapshot: { isActive, code: existing.code },
  });
}

export async function clonePlan(
  sourcePlanId: string,
  newCode: string,
  newName: string,
  adminUserId: string,
) {
  const [source] = await db.select().from(plans).where(eq(plans.id, sourcePlanId)).limit(1);
  if (!source) throw new Error("Source plan not found.");

  const sourceLimits = await db
    .select()
    .from(planFeatureLimits)
    .where(eq(planFeatureLimits.planId, sourcePlanId));

  const newId = crypto.randomUUID();
  const currencyCode = (source.currencyCode ?? "USD").toUpperCase();

  await db.insert(plans).values({
    id: newId,
    code: newCode,
    name: newName,
    description: source.description,
    currencyCode,
    monthlyPriceCents: source.monthlyPriceCents,
    yearlyPriceCents: source.yearlyPriceCents,
    trialDays: source.trialDays,
    maxSeats: source.maxSeats,
    maxProjects: source.maxProjects,
    maxClients: source.maxClients,
    monthlyApiCallsLimit: source.monthlyApiCallsLimit,
    displayOrder: source.displayOrder,
    recommendedBadge: null,
    features: source.features,
    isActive: false,
  });

  const stripeResult = await createStripeProductAndPrices({
    code: newCode,
    name: newName,
    description: source.description,
    currencyCode,
    monthlyPriceCents: source.monthlyPriceCents,
    yearlyPriceCents: source.yearlyPriceCents,
  });

  if (stripeResult) {
    await db
      .update(plans)
      .set({
        stripeProductId: stripeResult.productId,
        stripeMonthlyPriceId: stripeResult.monthlyPriceId,
        stripeYearlyPriceId: stripeResult.yearlyPriceId,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, newId));
  }

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

  await logPlanAction({
    adminUserId,
    action: "clone_plan",
    planId: newId,
    afterSnapshot: {
      sourcePlanId,
      newCode,
      newName,
      stripeProductId: stripeResult?.productId ?? null,
    },
  });

  return newId;
}

/**
 * Cloned plans are created with isActive = false so the admin can review
 * them before they show up on the public pricing page.
 */
