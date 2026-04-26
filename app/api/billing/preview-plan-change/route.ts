import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { stripe, withStripeBreaker, StripeCircuitOpenError } from "@/server/third-party/stripe";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { db } from "@/server/db/client";
import { subscriptions, organizationCurrentSubscriptions, plans } from "@/db/schema";
import { logger } from "@/server/observability/logger";

/**
 * Returns a proration preview for switching the active subscription to the
 * given plan. The actual change is NOT applied - the customer is shown the
 * pre-rated amount and asked to confirm via /api/billing/change-plan.
 *
 * Response shape:
 *   {
 *     amountDueNow: number,         // in cents (signed; negative = credit)
 *     currency: string,
 *     prorationLines: Array<{ description, amount }>,
 *     nextBillingAt: number | null  // unix seconds
 *   }
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

  // Resolve the active subscription + its Stripe IDs.
  const [row] = await db
    .select({
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      stripeCustomerId: subscriptions.stripeCustomerId,
      planId: subscriptions.planId,
    })
    .from(organizationCurrentSubscriptions)
    .innerJoin(subscriptions, eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id))
    .where(eq(organizationCurrentSubscriptions.organizationId, context.organizationId))
    .limit(1);

  if (!row?.stripeSubscriptionId || !row?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No active Stripe subscription on this organization." },
      { status: 400 },
    );
  }

  // Resolve the target plan and pick the right Stripe price.
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

    // `invoices.upcoming` previews what the customer would owe right now if
    // we applied the change. `proration_behavior: create_prorations` matches
    // what we'll send when the user confirms.
    const preview = await withStripeBreaker("invoices.upcoming", () =>
      // Cast - the Stripe SDK type for upcoming params drops some fields in
      // newer API versions but the underlying endpoint still accepts them.
      (
        stripe.invoices as unknown as {
          upcoming: (params: Record<string, unknown>) => Promise<unknown>;
        }
      ).upcoming({
        customer: row.stripeCustomerId!,
        subscription: row.stripeSubscriptionId!,
        subscription_items: [{ id: currentItem.id, price: targetPriceId, quantity: 1 }],
        subscription_proration_behavior: "create_prorations",
      }),
    );

    const previewInvoice = preview as {
      amount_due?: number;
      currency?: string;
      next_payment_attempt?: number | null;
      lines?: {
        data?: Array<{ description?: string | null; amount?: number; proration?: boolean }>;
      };
    };

    const prorationLines = (previewInvoice.lines?.data ?? [])
      .filter((line) => line.proration)
      .map((line) => ({
        description: line.description ?? "Adjustment",
        amount: line.amount ?? 0,
      }));

    return NextResponse.json({
      amountDueNow: previewInvoice.amount_due ?? 0,
      currency: previewInvoice.currency ?? "usd",
      prorationLines,
      nextBillingAt: previewInvoice.next_payment_attempt ?? null,
    });
  } catch (err) {
    if (err instanceof StripeCircuitOpenError) {
      return NextResponse.json(
        { error: "Billing is temporarily unavailable. Please try again in a moment." },
        { status: 503 },
      );
    }
    logger.error("billing.preview_plan_change.failed", err, {
      organizationId: context.organizationId,
      planCode,
    });
    return NextResponse.json({ error: "Could not load proration preview." }, { status: 502 });
  }
}
