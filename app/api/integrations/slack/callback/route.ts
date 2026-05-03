import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { writeAuditLog } from "@/server/security/audit";
import { exchangeOAuthCode } from "@/server/integrations/slack/client";
import { upsertSlackIntegration } from "@/server/integrations/slack/repository";
import { getSlackRedirectUri, verifyOAuthState } from "@/server/integrations/slack/state";
import type { SlackIntegrationConfig } from "@/db/schema";

/**
 * OAuth redirect target. Validates the state token Slack echoes back, then
 * exchanges the `code` for an access token + an `incoming_webhook` URL.
 *
 * Security notes:
 *  - The state HMAC binds the install to the user/org that started it. Even
 *    if the OAuth `code` is intercepted, an attacker can't redirect the
 *    install to their own organization.
 *  - The current session's user must match the user encoded in the state.
 *    This catches the case where the install was started by user A but a
 *    different user is signed in by the time Slack redirects back.
 */
function appUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_URL!);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const slackError = req.nextUrl.searchParams.get("error");

  // The user clicked Cancel on the Slack consent screen.
  if (slackError) {
    return NextResponse.redirect(appUrl("/settings/integrations", { error: slackError }));
  }
  if (!code || !state) {
    return NextResponse.redirect(appUrl("/settings/integrations", { error: "missing_params" }));
  }

  const verified = verifyOAuthState(state);
  if (!verified.ok) {
    return NextResponse.redirect(appUrl("/settings/integrations", { error: "invalid_state" }));
  }

  const session = await getServerSession();
  if (!session?.user || session.user.id !== verified.userId) {
    return NextResponse.redirect(appUrl("/settings/integrations", { error: "session_mismatch" }));
  }

  const oauth = await exchangeOAuthCode({ code, redirectUri: getSlackRedirectUri() });
  if (!oauth.ok || !oauth.access_token || !oauth.incoming_webhook) {
    return NextResponse.redirect(
      appUrl("/settings/integrations", { error: oauth.error ?? "oauth_failed" }),
    );
  }

  const config: SlackIntegrationConfig = {
    accessToken: oauth.access_token,
    webhookUrl: oauth.incoming_webhook.url,
    channelName: oauth.incoming_webhook.channel ?? null,
    channelId: oauth.incoming_webhook.channel_id ?? null,
    teamId: oauth.team?.id ?? null,
    teamName: oauth.team?.name ?? null,
    botUserId: oauth.bot_user_id ?? null,
    scopes: oauth.scope ? oauth.scope.split(",") : [],
  };

  await upsertSlackIntegration({
    organizationId: verified.organizationId,
    config,
    installedByUserId: verified.userId,
  });

  writeAuditLog({
    organizationId: verified.organizationId,
    actorUserId: verified.userId,
    action: "integration.slack.installed",
    entityType: "integration",
    entityId: "slack",
    metadata: {
      teamId: config.teamId,
      teamName: config.teamName,
      channelName: config.channelName,
    },
  }).catch(console.error);

  return NextResponse.redirect(appUrl("/settings/integrations", { connected: "slack" }));
}
