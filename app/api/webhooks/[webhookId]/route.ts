import { NextRequest, NextResponse } from "next/server";
import { updateWebhookForUser, deleteWebhookForUser } from "@/server/webhooks/data";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";

type Params = { params: Promise<{ webhookId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { webhookId } = await params;
    const body = await request.json();
    await updateWebhookForUser(userId, webhookId, {
      name: body?.name,
      url: body?.url,
      events: body?.events,
      isActive: body?.isActive,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { webhookId } = await params;
    await deleteWebhookForUser(userId, webhookId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
