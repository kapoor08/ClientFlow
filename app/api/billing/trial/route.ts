import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { db } from "@/server/db/client";
import {
  plans,
  subscriptions,
  organizationCurrentSubscriptions,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await getOrganizationSettingsContextForUser(session.user.id);
  if (!context) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  const orgId = context.organizationId;

  // If already has a subscription, don't create another
  const [existing] = await db
    .select({ id: organizationCurrentSubscriptions.id })
    .from(organizationCurrentSubscriptions)
    .where(eq(organizationCurrentSubscriptions.organizationId, orgId))
    .limit(1);

  if (existing) {
    return NextResponse.json({ ok: true });
  }

  // Find the free plan
  const [freePlan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.code, "free"))
    .limit(1);

  if (!freePlan) {
    return NextResponse.json(
      { error: "Free plan not found. Run: npm run db:seed:plans" },
      { status: 500 },
    );
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const subscriptionId = crypto.randomUUID();

  await db.insert(subscriptions).values({
    id: subscriptionId,
    organizationId: orgId,
    planId: freePlan.id,
    status: "trialing",
    billingCycle: "monthly",
    startedAt: new Date(),
    currentPeriodEnd: trialEndsAt,
    trialEndsAt,
    cancelAtPeriodEnd: false,
  });

  await db.insert(organizationCurrentSubscriptions).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    subscriptionId,
  });

  return NextResponse.json({ ok: true });
}
