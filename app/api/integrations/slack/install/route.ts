import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { getSlackRedirectUri, signOAuthState } from "@/server/integrations/slack/state";

/**
 * Kicks off the Slack OAuth install. Redirects the browser to Slack's
 * authorize URL with a signed state token. The callback at
 * /api/integrations/slack/callback verifies the state and finishes install.
 *
 * Scopes requested: `incoming-webhook` (Slack provisions a channel-scoped
 * webhook URL) + `chat:write` (kept for future per-channel routing without
 * a re-install round trip).
 */
const SLACK_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize";
const SCOPES = ["incoming-webhook", "chat:write"];

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/sign-in", process.env.NEXT_PUBLIC_APP_URL!));
  }

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx) {
    return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL!));
  }
  if (!ctx.canManageSettings) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=forbidden", process.env.NEXT_PUBLIC_APP_URL!),
    );
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=not_configured", process.env.NEXT_PUBLIC_APP_URL!),
    );
  }

  const state = signOAuthState({ organizationId: ctx.organizationId, userId: session.user.id });

  const params = new URLSearchParams({
    client_id: clientId,
    scope: SCOPES.join(","),
    redirect_uri: getSlackRedirectUri(),
    state,
  });

  return NextResponse.redirect(`${SLACK_AUTHORIZE_URL}?${params.toString()}`);
}
