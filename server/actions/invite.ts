"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { acceptInvitationForUser } from "@/server/invitations";
import { getWorkspaceHomeHrefForRole } from "@/server/organization-settings";
import { setActiveOrgCookie } from "@/server/auth/active-org";
import { checkActionRateLimit } from "@/server/rate-limit";

export async function acceptInviteAction(token: string) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect(`/auth/sign-in?redirectTo=/invite/${token}`);
  }

  // Throttle per user so this token-accepting action can't be used to
  // brute-force invitation tokens (P2-3).
  if (!(await checkActionRateLimit("invite-accept", session.user.id))) {
    redirect(
      `/invite/${token}?error=${encodeURIComponent("Too many attempts. Please wait a minute and try again.")}`,
    );
  }

  let result: { organizationId: string; roleKey: string | null } | null = null;
  let acceptError: string | null = null;

  try {
    result = await acceptInvitationForUser(session.user.id, token);
  } catch (err) {
    acceptError = err instanceof Error ? err.message : "Could not accept invitation.";
  }

  if (acceptError || !result) {
    redirect(
      `/invite/${token}?error=${encodeURIComponent(acceptError ?? "Could not accept invitation.")}`,
    );
  }

  // Switch active org context to the newly joined org
  await setActiveOrgCookie(result.organizationId);

  const home = getWorkspaceHomeHrefForRole(result.roleKey);
  redirect(`${home}?welcome=1`);
}
