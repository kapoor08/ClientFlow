import { NextResponse } from "next/server";
import { stripe, STRIPE_PRICE_MAP } from "@/lib/stripe";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";

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

  const priceId = STRIPE_PRICE_MAP[planCode];
  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
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
  });

  return NextResponse.json({ url: checkoutSession.url });
}
