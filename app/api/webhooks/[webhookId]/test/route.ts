import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { and, eq } from "drizzle-orm";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { db } from "@/lib/db";
import { outboundWebhooks } from "@/db/schema";

type Params = { params: Promise<{ webhookId: string }> };

/**
 * POST /api/webhooks/[webhookId]/test
 *
 * Sends a signed test ping to the webhook URL and returns
 * the HTTP status code received from the destination server.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { webhookId } = await params;

    const ctx = await getOrganizationSettingsContextForUser(userId);
    if (!ctx) throw new Error("No active organization found.");
    if (!ctx.canManageSettings) throw new Error("Only admins can test webhooks.");

    const [hook] = await db
      .select({ url: outboundWebhooks.url, secret: outboundWebhooks.secret })
      .from(outboundWebhooks)
      .where(
        and(
          eq(outboundWebhooks.id, webhookId),
          eq(outboundWebhooks.organizationId, ctx.organizationId),
        ),
      )
      .limit(1);

    if (!hook) throw new Error("Webhook not found.");

    const body = JSON.stringify({
      event: "ping",
      data: { message: "This is a test event from ClientFlow." },
      timestamp: new Date().toISOString(),
    });

    const sig = createHmac("sha256", hook.secret).update(body).digest("hex");

    let statusCode: number;
    let deliveryError: string | null = null;

    try {
      const res = await fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ClientFlow-Signature": `sha256=${sig}`,
          "X-ClientFlow-Event": "ping",
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      statusCode = res.status;
    } catch (err) {
      deliveryError = err instanceof Error ? err.message : "Request failed";
      statusCode = 0;
    }

    const success = statusCode >= 200 && statusCode < 300;
    return NextResponse.json({ success, statusCode, error: deliveryError });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
