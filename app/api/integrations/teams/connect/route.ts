import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { writeAuditLog } from "@/server/security/audit";
import { isValidPowerAutomateUrl } from "@/server/integrations/teams/client";
import { upsertTeamsIntegration } from "@/server/integrations/teams/repository";
import type { TeamsIntegrationConfig } from "@/db/schema";

/**
 * Save (or replace) the org's Teams integration. Unlike Slack there is no
 * OAuth round-trip - the user pastes the Power Automate webhook URL they
 * generated in the Teams Workflows app, plus a friendly label so they
 * remember which channel/team it points at.
 */
const ConnectInput = z.object({
  webhookUrl: z.string().min(1, "Webhook URL is required."),
  channelLabel: z.string().trim().max(120).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx) return NextResponse.json({ error: "no_org" }, { status: 400 });
  if (!ctx.canManageSettings) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ConnectInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 },
    );
  }

  const webhookUrl = parsed.data.webhookUrl.trim();
  if (!isValidPowerAutomateUrl(webhookUrl)) {
    return NextResponse.json(
      {
        error:
          "URL doesn't look like a Power Automate webhook. It should start with https:// and end with the Logic Apps host (logic.azure.com).",
      },
      { status: 400 },
    );
  }

  const config: TeamsIntegrationConfig = {
    webhookUrl,
    channelLabel: parsed.data.channelLabel?.trim() || null,
  };

  await upsertTeamsIntegration({
    organizationId: ctx.organizationId,
    config,
    installedByUserId: session.user.id,
  });

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: session.user.id,
    action: "integration.teams.connected",
    entityType: "integration",
    entityId: "teams",
    metadata: { channelLabel: config.channelLabel },
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
