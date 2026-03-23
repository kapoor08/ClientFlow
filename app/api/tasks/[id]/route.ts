import { NextRequest, NextResponse } from "next/server";
import { updateTaskForUser, deleteTaskForUser } from "@/lib/tasks";
import { taskFormSchema } from "@/lib/tasks-shared";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ id: string }> };

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
