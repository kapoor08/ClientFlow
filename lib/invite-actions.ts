"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { acceptInvitationForUser } from "@/lib/invitations";
import { getWorkspaceHomeHrefForRole } from "@/lib/organization-settings";
import { setActiveOrgCookie } from "@/lib/active-org";

export async function acceptInviteAction(token: string) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect(`/auth/sign-in?redirectTo=/invite/${token}`);
  }

  let result: { organizationId: string; roleKey: string | null } | null = null;
  let acceptError: string | null = null;

  try {
    result = await acceptInvitationForUser(session.user.id, token);
  } catch (err) {
    acceptError = err instanceof Error ? err.message : "Could not accept invitation.";
  }

  if (acceptError || !result) {
    redirect(`/invite/${token}?error=${encodeURIComponent(acceptError ?? "Could not accept invitation.")}`);
  }

  // Switch active org context to the newly joined org
  await setActiveOrgCookie(result.organizationId);

  const home = getWorkspaceHomeHrefForRole(result.roleKey);
  redirect(`${home}?welcome=1`);
}
