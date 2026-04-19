import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { plans } from "@/db/schema";

export type PublicPlan = {
  code: string;
  name: string;
  description: string | null;
  monthlyPriceCents: number | null;
  yearlyPriceCents: number | null;
  currencyCode: string | null;
  features: string[];
  recommendedBadge: string | null;
  trialDays: number | null;
};

/**
 * Returns the active plans for the public pricing / marketing pages, ordered
 * by displayOrder (ascending). Inactive plans are hidden.
 */
export async function getPublicPlans(): Promise<PublicPlan[]> {
  const rows = await db
    .select({
      code: plans.code,
      name: plans.name,
      description: plans.description,
      monthlyPriceCents: plans.monthlyPriceCents,
      yearlyPriceCents: plans.yearlyPriceCents,
      currencyCode: plans.currencyCode,
      features: plans.features,
      recommendedBadge: plans.recommendedBadge,
      trialDays: plans.trialDays,
    })
    .from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(asc(plans.displayOrder), asc(plans.code));

  return rows.map((r) => ({
    ...r,
    features: r.features ?? [],
  }));
}
