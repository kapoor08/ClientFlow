import { NextRequest, NextResponse } from "next/server";
import { updateTaskComment, deleteTaskComment } from "@/lib/task-comments";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ id: string; commentId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id, commentId } = await params;

    const body = await request.json();
    const commentBody = (body?.body ?? "").trim();
    if (!commentBody) throw new ApiError("Comment body is required.", 422);

    await updateTaskComment(userId, id, commentId, commentBody);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id, commentId } = await params;

    await deleteTaskComment(userId, id, commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
