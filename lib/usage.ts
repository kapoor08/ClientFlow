import "server-only";

import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { usageCounters } from "@/db/schema";

export type UsageCheckResult = {
  used: number;
  limit: number;
  percent: number;
  isBlocked: boolean;
  isWarning: boolean;
};

function getMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function checkMonthlyUsage(
  organizationId: string,
  featureKey: string,
  limit: number,
): Promise<UsageCheckResult> {
  const { start, end } = getMonthBounds();

  const [row] = await db
    .select({ usedValue: usageCounters.usedValue })
    .from(usageCounters)
    .where(
      and(
        eq(usageCounters.organizationId, organizationId),
        eq(usageCounters.featureKey, featureKey),
        gte(usageCounters.periodStart, start),
        lte(usageCounters.periodStart, end),
      ),
    )
    .limit(1);

  const used = row?.usedValue ?? 0;
  const percent = limit > 0 ? Math.round((used / limit) * 100) : 100;

  return {
    used,
    limit,
    percent,
    isBlocked: used >= limit,
    isWarning: percent >= 80 && used < limit,
  };
}

export async function incrementMonthlyUsage(
  organizationId: string,
  featureKey: string,
): Promise<void> {
  const { start, end } = getMonthBounds();

  const [existing] = await db
    .select({ id: usageCounters.id, usedValue: usageCounters.usedValue })
    .from(usageCounters)
    .where(
      and(
        eq(usageCounters.organizationId, organizationId),
        eq(usageCounters.featureKey, featureKey),
        gte(usageCounters.periodStart, start),
        lte(usageCounters.periodStart, end),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(usageCounters)
      .set({ usedValue: existing.usedValue + 1, updatedAt: new Date() })
      .where(eq(usageCounters.id, existing.id));
  } else {
    await db.insert(usageCounters).values({
      id: crypto.randomUUID(),
      organizationId,
      featureKey,
      periodStart: start,
      periodEnd: end,
      usedValue: 1,
    });
  }
}
