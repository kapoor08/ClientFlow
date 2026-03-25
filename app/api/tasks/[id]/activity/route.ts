import { NextRequest, NextResponse } from "next/server";
import { listTaskActivity } from "@/lib/task-comments";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const activity = await listTaskActivity(userId, id);
    if (!activity) throw new ApiError("Task not found.", 404);

    return NextResponse.json({ activity });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
