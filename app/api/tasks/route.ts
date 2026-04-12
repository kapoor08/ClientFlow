import { NextRequest, NextResponse } from "next/server";
import { listTasksForUser, createTaskForUser } from "@/server/tasks";
import { taskFormSchema } from "@/schemas/tasks";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = request.nextUrl;

    const q = searchParams.get("q") ?? "";
    const status = searchParams.get("status") ?? undefined;
    const priority = searchParams.get("priority") ?? undefined;
    const projectId = searchParams.get("projectId") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE,
    );
    const order =
      searchParams.get("order") === "asc" ? "asc" : ("desc" as const);

    const result = await listTasksForUser(userId, {
      q,
      status,
      priority,
      projectId,
      page,
      pageSize,
      order,
    });

    if (!result) throw new ApiError("No active organization found.", 403);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json();
    if (body.dueDate) body.dueDate = new Date(body.dueDate);

    const parsed = taskFormSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request.";
      throw new ApiError(firstError, 422);
    }

    const result = await createTaskForUser(userId, parsed.data);
    return NextResponse.json({ taskId: result.taskId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
