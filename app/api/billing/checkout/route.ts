import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { plans } from "@/db/schema";
import {
  stripe,
  STRIPE_PRICE_MAP,
  withStripeBreaker,
  StripeCircuitOpenError,
} from "@/server/third-party/stripe";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { logger } from "@/server/observability/logger";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await getOrganizationSettingsContextForUser(session.user.id);
  if (!context) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  const body = await req.json();
  const planCode = (body.planCode as string)?.toLowerCase();
  if (!planCode) {
    return NextResponse.json({ error: "Missing planCode" }, { status: 400 });
  }

  // Resolve Stripe Price ID: DB-managed plans first, then env fallback.
  const [plan] = await db
    .select({
      stripeMonthlyPriceId: plans.stripeMonthlyPriceId,
      isActive: plans.isActive,
    })
    .from(plans)
    .where(and(eq(plans.code, planCode), eq(plans.isActive, true)))
    .limit(1);

  const priceId = plan?.stripeMonthlyPriceId ?? STRIPE_PRICE_MAP[planCode];
  if (!priceId) {
    return NextResponse.json({ error: "Plan is not available for checkout." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const checkoutSession = await withStripeBreaker("checkout.sessions.create", () =>
      stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/billing/success`,
        cancel_url: `${appUrl}/billing/failed`,
        customer_email: session.user.email,
        metadata: {
          organizationId: context.organizationId,
          planCode,
        },
        subscription_data: {
          metadata: {
            organizationId: context.organizationId,
            planCode,
          },
        },
      }),
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    if (err instanceof StripeCircuitOpenError) {
      return NextResponse.json(
        { error: "Billing is temporarily unavailable. Please try again in a moment." },
        { status: 503 },
      );
    }
    logger.error("billing.checkout.failed", err, { planCode });
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
