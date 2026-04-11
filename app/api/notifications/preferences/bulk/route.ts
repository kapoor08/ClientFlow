import { NextRequest, NextResponse } from "next/server";
import { bulkUpdateNotificationPreferencesForUser } from "@/lib/notifications";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

// POST /api/notifications/preferences/bulk - { inAppEnabled?, emailEnabled? }
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    const { inAppEnabled, emailEnabled } = body as {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
    };

    if (inAppEnabled === undefined && emailEnabled === undefined) {
      throw new ApiError("At least one of inAppEnabled or emailEnabled is required.", 422);
    }

    await bulkUpdateNotificationPreferencesForUser(userId, {
      inAppEnabled,
      emailEnabled,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
