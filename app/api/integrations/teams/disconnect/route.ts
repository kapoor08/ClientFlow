import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { writeAuditLog } from "@/server/security/audit";
import {
  deleteTeamsIntegration,
  getTeamsIntegration,
} from "@/server/integrations/teams/repository";

/**
 * Disconnects the Teams integration for the active organization.
 *
 * Unlike Slack there's no token to revoke - Power Automate auth lives in
 * the URL itself. To fully cut access the user can delete or disable the
 * underlying flow in the Teams Workflows app (we surface that hint in the
 * UI after disconnect).
 */
export async function POST() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx) return NextResponse.json({ error: "no_org" }, { status: 400 });
  if (!ctx.canManageSettings) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const integration = await getTeamsIntegration(ctx.organizationId);
  if (!integration) {
    return NextResponse.json({ ok: true, alreadyDisconnected: true });
  }

  await deleteTeamsIntegration(ctx.organizationId);

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: session.user.id,
    action: "integration.teams.disconnected",
    entityType: "integration",
    entityId: "teams",
    metadata: { channelLabel: integration.config.channelLabel },
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
