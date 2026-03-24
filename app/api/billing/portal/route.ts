import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { db } from "@/lib/db";
import { subscriptions, organizationCurrentSubscriptions } from "@/db/schema";
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

  // Find the current subscription's Stripe customer ID
  const [row] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(organizationCurrentSubscriptions)
    .innerJoin(
      subscriptions,
      eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id),
    )
    .where(eq(organizationCurrentSubscriptions.organizationId, context.organizationId))
    .limit(1);

  if (!row?.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${appUrl}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
