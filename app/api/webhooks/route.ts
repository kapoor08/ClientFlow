import { NextRequest, NextResponse } from "next/server";
import { listWebhooksForUser, createWebhookForUser } from "@/server/webhooks/data";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const webhooks = await listWebhooksForUser(userId);
    if (!webhooks) throw new ApiError("No active organization found.", 403);
    return NextResponse.json({
      webhooks: webhooks.map((w) => ({
        ...w,
        lastTriggeredAt: w.lastTriggeredAt?.toISOString() ?? null,
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const name = body?.name as string | undefined;
    const url = body?.url as string | undefined;
    const events = body?.events as string[] | undefined;

    if (!name?.trim()) throw new ApiError("Webhook name is required.", 422);
    if (!url?.trim()) throw new ApiError("Webhook URL is required.", 422);
    if (!Array.isArray(events) || events.length === 0)
      throw new ApiError("At least one event must be selected.", 422);

    const webhook = await createWebhookForUser(userId, { name, url, events });
    return NextResponse.json(
      {
        ...webhook,
        lastTriggeredAt: webhook.lastTriggeredAt?.toISOString() ?? null,
        createdAt: webhook.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    return apiErrorResponse(err);
  }
}
