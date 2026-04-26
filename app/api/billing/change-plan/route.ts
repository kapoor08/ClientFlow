import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { stripe, withStripeBreaker, StripeCircuitOpenError } from "@/server/third-party/stripe";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { db } from "@/server/db/client";
import { subscriptions, organizationCurrentSubscriptions, plans } from "@/db/schema";
import { logger } from "@/server/observability/logger";

/**
 * Applies the plan change on Stripe with proration. The DB-side update of
 * `subscriptions.planId` happens via the subsequent `customer.subscription.updated`
 * webhook - no need to write here.
 */
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await getOrganizationSettingsContextForUser(session.user.id);
  if (!context) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as {
    planCode?: string;
    cycle?: "month" | "year";
  } | null;

  const planCode = body?.planCode?.toLowerCase();
  const cycle = body?.cycle ?? "month";
  if (!planCode) {
    return NextResponse.json({ error: "Missing planCode" }, { status: 400 });
  }

  const [row] = await db
    .select({
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      planId: subscriptions.planId,
    })
    .from(organizationCurrentSubscriptions)
    .innerJoin(subscriptions, eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id))
    .where(eq(organizationCurrentSubscriptions.organizationId, context.organizationId))
    .limit(1);

  if (!row?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "No active Stripe subscription on this organization." },
      { status: 400 },
    );
  }

  const [targetPlan] = await db
    .select({
      id: plans.id,
      stripeMonthlyPriceId: plans.stripeMonthlyPriceId,
      stripeYearlyPriceId: plans.stripeYearlyPriceId,
    })
    .from(plans)
    .where(eq(plans.code, planCode))
    .limit(1);

  if (!targetPlan) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }
  if (targetPlan.id === row.planId) {
    return NextResponse.json({ error: "Already on this plan." }, { status: 400 });
  }

  const targetPriceId =
    cycle === "year" ? targetPlan.stripeYearlyPriceId : targetPlan.stripeMonthlyPriceId;
  if (!targetPriceId) {
    return NextResponse.json(
      { error: `Plan has no ${cycle}ly price configured.` },
      { status: 400 },
    );
  }

  try {
    const sub = await withStripeBreaker("subscriptions.retrieve", () =>
      stripe.subscriptions.retrieve(row.stripeSubscriptionId!),
    );
    const currentItem = sub.items.data[0];
    if (!currentItem) {
      return NextResponse.json({ error: "Subscription has no item to swap." }, { status: 400 });
    }

    await withStripeBreaker("subscriptions.update", () =>
      stripe.subscriptions.update(row.stripeSubscriptionId!, {
        proration_behavior: "create_prorations",
        items: [{ id: currentItem.id, price: targetPriceId, quantity: 1 }],
        metadata: {
          ...sub.metadata,
          planCode,
        },
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StripeCircuitOpenError) {
      return NextResponse.json(
        { error: "Billing is temporarily unavailable. Please try again in a moment." },
        { status: 503 },
      );
    }
    logger.error("billing.change_plan.failed", err, {
      organizationId: context.organizationId,
      planCode,
    });
    return NextResponse.json({ error: "Could not change plan." }, { status: 502 });
  }
}
