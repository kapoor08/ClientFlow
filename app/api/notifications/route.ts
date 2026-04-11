import { NextResponse } from "next/server";
import {
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  deleteAllNotificationsForUser,
} from "@/lib/notifications";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";

// GET /api/notifications - list with unread count
export async function GET() {
  try {
    const { userId } = await requireAuth();
    const result = await listNotificationsForUser(userId, { limit: 50 });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// POST /api/notifications/mark-all-read via action param
export async function POST() {
  try {
    const { userId } = await requireAuth();
    await markAllNotificationsReadForUser(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// DELETE /api/notifications - delete all notifications for the user
export async function DELETE() {
  try {
    const { userId } = await requireAuth();
    await deleteAllNotificationsForUser(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
