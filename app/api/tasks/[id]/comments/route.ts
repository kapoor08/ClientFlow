import { NextRequest, NextResponse } from "next/server";
import { listTaskComments, createTaskComment } from "@/server/task-comments";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const comments = await listTaskComments(userId, id);
    if (!comments) throw new ApiError("Task not found.", 404);

    return NextResponse.json({ comments });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const commentBody = (body?.body ?? "").trim();
    if (!commentBody) throw new ApiError("Comment body is required.", 422);

    const result = await createTaskComment(userId, id, commentBody);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
