import { NextRequest, NextResponse } from "next/server";
import {
  listSubtasksForTask,
  createSubtaskForUser,
} from "@/server/task-subtasks";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const subtasks = await listSubtasksForTask(userId, id);
    if (!subtasks) throw new ApiError("Task not found.", 404);

    return NextResponse.json({ subtasks });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const title = (body?.title ?? "").trim();
    if (!title) throw new ApiError("Subtask title is required.", 422);

    const result = await createSubtaskForUser(userId, id, title);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
