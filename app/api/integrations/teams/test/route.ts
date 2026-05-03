import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { sendTeamsMessage } from "@/server/integrations/teams/send";
import { buildSimpleMessage } from "@/server/integrations/teams/payloads";

/**
 * "Send test message" button on the integrations settings page. Posts a
 * harmless ping to the connected Teams channel so the user can confirm
 * the Power Automate flow is wired up correctly.
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

  const result = await sendTeamsMessage(
    ctx.organizationId,
    buildSimpleMessage({
      title: "ClientFlow is connected",
      body: `Test message from ${ctx.organizationName}. If you can read this, real notifications will land here too.`,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/settings/integrations`,
      actionLabel: "Open Integrations",
    }),
  );

  if (!result.delivered) {
    return NextResponse.json({ error: result.reason ?? "delivery_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
