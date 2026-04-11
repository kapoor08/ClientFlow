import { NextRequest, NextResponse } from "next/server";
import {
  savePushSubscriptionForUser,
  deletePushSubscriptionForUser,
} from "@/lib/notifications";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

// POST - save a push subscription
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    const { endpoint, p256dh, auth } = body as {
      endpoint?: string;
      p256dh?: string;
      auth?: string;
    };

    if (!endpoint || !p256dh || !auth) {
      throw new ApiError("endpoint, p256dh, and auth are required.", 422);
    }

    await savePushSubscriptionForUser(userId, { endpoint, p256dh, auth });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// DELETE - remove a push subscription
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    if (!body?.endpoint) throw new ApiError("endpoint is required.", 422);

    await deletePushSubscriptionForUser(userId, body.endpoint);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
