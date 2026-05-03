import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { writeAuditLog } from "@/server/security/audit";
import { revokeBotToken } from "@/server/integrations/slack/client";
import {
  deleteSlackIntegration,
  getSlackIntegration,
} from "@/server/integrations/slack/repository";

/**
 * Disconnects the Slack integration for the active organization.
 *
 * Order matters: revoke first (best-effort), then delete the row. If revoke
 * fails Slack-side, we still drop our row - leaving an orphaned bot token
 * on Slack is annoying but not security-relevant since Slack rotates them
 * if the user re-installs.
 */
export async function POST() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx) {
    return NextResponse.json({ error: "no_org" }, { status: 400 });
  }
  if (!ctx.canManageSettings) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const integration = await getSlackIntegration(ctx.organizationId);
  if (!integration) {
    return NextResponse.json({ ok: true, alreadyDisconnected: true });
  }

  if (integration.config.accessToken) {
    revokeBotToken(integration.config.accessToken).catch(console.error);
  }

  await deleteSlackIntegration(ctx.organizationId);

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: session.user.id,
    action: "integration.slack.disconnected",
    entityType: "integration",
    entityId: "slack",
    metadata: {
      teamId: integration.config.teamId,
      channelName: integration.config.channelName,
    },
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
