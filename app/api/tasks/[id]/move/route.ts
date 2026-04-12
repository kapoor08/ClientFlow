import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";
import { moveTaskColumnForUser } from "@/server/tasks";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { id: taskId } = await params;
    const body = await request.json();

    const columnId =
      body.columnId === null ? null : typeof body.columnId === "string" ? body.columnId : null;

    await moveTaskColumnForUser(userId, taskId, columnId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
