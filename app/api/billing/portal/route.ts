import { NextResponse } from "next/server";
import { stripe, withStripeBreaker, StripeCircuitOpenError } from "@/server/third-party/stripe";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { db } from "@/server/db/client";
import { subscriptions, organizationCurrentSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/server/observability/logger";

export async function POST() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await getOrganizationSettingsContextForUser(session.user.id);
  if (!context) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  // Find the current subscription's Stripe customer ID
  const [row] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(organizationCurrentSubscriptions)
    .innerJoin(subscriptions, eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id))
    .where(eq(organizationCurrentSubscriptions.organizationId, context.organizationId))
    .limit(1);

  if (!row?.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  const customerId = row.stripeCustomerId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const portalSession = await withStripeBreaker("billingPortal.sessions.create", () =>
      stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/billing`,
      }),
    );
    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    if (err instanceof StripeCircuitOpenError) {
      return NextResponse.json(
        { error: "Billing portal is temporarily unavailable. Please try again in a moment." },
        { status: 503 },
      );
    }
    logger.error("billing.portal.failed", err);
    return NextResponse.json(
      { error: "Could not open billing portal. Please try again." },
      { status: 502 },
    );
  }
}
