import { NextRequest, NextResponse } from "next/server";
import { updateTaskForUser, deleteTaskForUser } from "@/server/tasks";
import { getTaskDetailForUser } from "@/server/task-detail";
import { taskFormSchema } from "@/schemas/tasks";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const task = await getTaskDetailForUser(userId, id);
    if (!task) throw new ApiError("Task not found.", 404);

    return NextResponse.json(task);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    if (body.dueDate) body.dueDate = new Date(body.dueDate);

    const parsed = taskFormSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request.";
      throw new ApiError(firstError, 422);
    }

    const result = await updateTaskForUser(userId, id, parsed.data);
    return NextResponse.json({ taskId: result.taskId });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await deleteTaskForUser(userId, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
