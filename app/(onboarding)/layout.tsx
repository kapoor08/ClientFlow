import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { finishOnboardingAction } from "./onboarding/actions";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);

  // Already completed - skip straight to the app
  if (ctx?.onboardingCompletedAt) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/app-logo.png"
            alt="ClientFlow"
            width={120}
            height={26}
            className="h-auto w-auto"
            priority
          />
        </Link>
        {/* Skip marks onboarding complete so the user isn't looped back */}
        <form action={finishOnboardingAction}>
          <button
            type="submit"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Skip setup →
          </button>
        </form>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
    </div>
  );
}
