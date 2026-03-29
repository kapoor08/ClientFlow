import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
import AppShell from "@/components/layout/AppShell";
import { authRoutes } from "@/core/auth";
import { getServerSession } from "@/lib/get-session";
import { getSubscriptionContextForUser } from "@/lib/subscription-context";
import {
  getOrganizationSettingsContextForUser,
  listOrganizationsForUser,
} from "@/lib/organization-settings";
import { getActiveOrgIdFromCookie } from "@/lib/active-org";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect(authRoutes.signIn);
  }

  const requireEmailVerification =
    process.env.BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION === "true";

  if (requireEmailVerification && !session.user.emailVerified) {
    redirect(
      `${authRoutes.verifyEmail}?email=${encodeURIComponent(session.user.email)}`,
    );
  }

  // Subscription gate
  const [sub, orgCtx, orgs, activeOrgId] = await Promise.all([
    getSubscriptionContextForUser(session.user.id),
    getOrganizationSettingsContextForUser(session.user.id),
    listOrganizationsForUser(session.user.id),
    getActiveOrgIdFromCookie(),
  ]);

  if (!sub || !sub.hasAccess) {
    redirect("/plans");
  }

  return (
    <AppShell
      user={session.user}
      planCode={sub.planCode}
      daysLeftInTrial={sub.isTrialing ? (sub.daysLeftInTrial ?? 0) : null}
      roleKey={sub.roleKey ?? null}
      orgName={orgCtx?.organizationName ?? null}
      logoUrl={orgCtx?.logoUrl ?? null}
      brandColor={orgCtx?.brandColor ?? null}
      orgs={orgs}
      activeOrgId={activeOrgId ?? orgCtx?.organizationId ?? ""}
      rolePermissions={orgCtx?.rolePermissionsConfig ?? null}
      memberPermissionOverrides={orgCtx?.memberPermissionOverrides ?? null}
    >
      {children}
    </AppShell>
  );
}
