import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { sendSlackMessage } from "@/server/integrations/slack/send";
import { buildSimpleMessage } from "@/server/integrations/slack/payloads";

/**
 * "Send test message" button on the integrations settings page. Posts a
 * harmless ping to the connected channel so the user can confirm the
 * webhook URL works and the message renders the way they expect before
 * relying on it for real notifications.
 */
export async function POST() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx) return NextResponse.json({ error: "no_org" }, { status: 400 });
  if (!ctx.canManageSettings) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const result = await sendSlackMessage(
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
