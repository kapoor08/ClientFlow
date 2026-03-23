import { NextRequest, NextResponse } from "next/server";
import { markNotificationReadForUser } from "@/lib/notifications";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/notifications/[id] — { isRead: boolean }
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    if (typeof body.isRead !== "boolean") {
      throw new ApiError("isRead must be a boolean.", 422);
    }

    await markNotificationReadForUser(userId, id, body.isRead);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
