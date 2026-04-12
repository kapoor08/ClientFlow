import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";
import { reorderTasksInColumnForUser } from "@/server/tasks";

export async function PATCH(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    const columnId = typeof body?.columnId === "string" ? body.columnId : null;
    const orderedIds = Array.isArray(body?.orderedIds)
      ? body.orderedIds.filter((id: unknown): id is string => typeof id === "string")
      : [];

    if (!columnId) {
      return NextResponse.json({ error: "columnId is required." }, { status: 400 });
    }

    await reorderTasksInColumnForUser(userId, columnId, orderedIds);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
