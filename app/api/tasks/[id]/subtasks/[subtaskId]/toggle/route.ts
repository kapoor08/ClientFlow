import { NextRequest, NextResponse } from "next/server";
import { toggleSubtaskStatusForUser } from "@/server/task-subtasks";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";

type RouteContext = { params: Promise<{ id: string; subtaskId: string }> };

export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { subtaskId } = await params;

    await toggleSubtaskStatusForUser(userId, subtaskId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
