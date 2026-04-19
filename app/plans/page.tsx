import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { getSubscriptionContextForUser } from "@/server/subscription/context";
import { getPublicPlans } from "@/server/public/plans";
import { PlansPage } from "@/components/plans";

export default async function PlansRoute() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const sub = await getSubscriptionContextForUser(session.user.id);

  // Already has active (non-expired) subscription - send to app
  if (sub && sub.hasAccess && !sub.isTrialExpired) {
    redirect("/dashboard");
  }

  const isExpired = sub?.isTrialExpired ?? false;
  const plans = await getPublicPlans();

  return <PlansPage isExpired={isExpired} plans={plans} />;
}
