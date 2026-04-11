import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionActivator } from "./SubscriptionActivator";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";

export const metadata: Metadata = {
  title: "Payment Successful",
};

export default async function BillingSuccessPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);

  // First-time purchase - send to onboarding
  if (!ctx?.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <SubscriptionActivator />
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-foreground">
          Plan upgraded!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your subscription is now active. All features on your plan are
          unlocked and ready to use.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card p-5 text-left space-y-3">
          <p className="text-sm font-medium text-foreground">What happens next?</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              Your plan is activated immediately
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              A receipt will be sent to your email
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              You can manage your billing anytime from the Billing page
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/billing">View Billing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
