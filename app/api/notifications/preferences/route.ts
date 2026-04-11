import { NextRequest, NextResponse } from "next/server";
import {
  getNotificationPreferencesForUser,
  updateNotificationPreferenceForUser,
} from "@/lib/notifications";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";
import type { NotificationEventKey } from "@/lib/notifications-shared";

// GET /api/notifications/preferences
export async function GET() {
  try {
    const { userId } = await requireAuth();
    const result = await getNotificationPreferencesForUser(userId);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// PATCH /api/notifications/preferences - { eventKey, inAppEnabled?, emailEnabled? }
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    const { eventKey, inAppEnabled, emailEnabled } = body as {
      eventKey: NotificationEventKey;
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
    };

    if (!eventKey) throw new ApiError("eventKey is required.", 422);

    await updateNotificationPreferenceForUser(userId, eventKey, {
      inAppEnabled,
      emailEnabled,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
