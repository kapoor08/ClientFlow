import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
import AppShell from "@/components/layout/AppShell";
import { authRoutes } from "@/core/auth";
import { auth } from "@/lib/auth";
import { getServerSession } from "@/lib/get-session";
import { getSubscriptionContextForUser } from "@/lib/subscription-context";
import {
  getOrganizationSettingsContextForUser,
  listOrganizationsForUser,
} from "@/lib/organization-settings";
import { getActiveOrgIdFromCookie } from "@/lib/active-org";
import { isIpAllowed, getClientIp } from "@/lib/ip-allowlist";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
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

  // Enforce org-level email verification policy from DB setting
  if (orgCtx?.requireEmailVerification && !session.user.emailVerified) {
    redirect(
      `${authRoutes.verifyEmail}?email=${encodeURIComponent(session.user.email)}`,
    );
  }

  const reqHeaders = await headers();

  // Enforce session timeout if the org has one configured
  if (orgCtx?.sessionTimeoutHours && session.session?.createdAt) {
    const timeoutMs = orgCtx.sessionTimeoutHours * 60 * 60 * 1000;
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
