import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

// Protected app routes are not indexable - they're per-tenant and require auth.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};
import AppShell from "@/components/layout/app/AppShell";
import { DeletionPendingBanner } from "@/components/security";
import { KeyboardShortcutsModal } from "@/components/common/KeyboardShortcutsModal";
import { GChordNavigation } from "@/components/common/GChordNavigation";
import { authRoutes } from "@/core/auth";
import { auth } from "@/server/auth/auth";
import { getServerSession } from "@/server/auth/session";
import { getSubscriptionContextForUser } from "@/server/subscription/context";
import {
  getOrganizationSettingsContextForUser,
  listOrganizationsForUser,
} from "@/server/organization-settings";
import { getActiveOrgIdFromCookie } from "@/server/auth/active-org";
import { isIpAllowed, getClientIp } from "@/server/security/ip-allowlist";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect(authRoutes.signIn);
  }

  // Platform admins belong in /admin, not the workspace UI
  if (session.user.isPlatformAdmin) {
    redirect("/admin");
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

  // Onboarding gate - first-time owners/admins/managers/members land here
  // after sign-up and subscription/trial activation. Clients are invited
  // into an existing org and skip this flow.
  if (orgCtx && !orgCtx.onboardingCompletedAt && sub.roleKey !== "client") {
    redirect("/onboarding");
  }

  // Enforce org-level email verification policy from DB setting
  if (orgCtx?.requireEmailVerification && !session.user.emailVerified) {
    redirect(`${authRoutes.verifyEmail}?email=${encodeURIComponent(session.user.email)}`);
  }

  const reqHeaders = await headers();

  // Enforce session timeout if the org has one configured
  if (orgCtx?.sessionTimeoutHours && session.session?.createdAt) {
    const timeoutMs = orgCtx.sessionTimeoutHours * 60 * 60 * 1000;
    // This is a Server Component, not a render-phase hook - reading the wall
    // clock is intentional and safe. The react-hooks/purity rule misfires here.
    // eslint-disable-next-line react-hooks/purity
    const sessionAge = Date.now() - new Date(session.session.createdAt).getTime();
    if (sessionAge > timeoutMs) {
      await auth.api.signOut({ headers: reqHeaders }).catch(() => {});
      redirect(`${authRoutes.signIn}?reason=session_expired`);
    }
  }

  // Enforce IP allowlist if the org has one configured
  if (orgCtx?.ipAllowlist && orgCtx.ipAllowlist.length > 0) {
    const clientIp = getClientIp(reqHeaders);
    if (!isIpAllowed(clientIp, orgCtx.ipAllowlist)) {
      redirect("/ip-blocked");
    }
  }

  return (
    <>
      <DeletionPendingBanner />
      <KeyboardShortcutsModal />
      <GChordNavigation />
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
    </>
  );
}
