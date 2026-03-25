import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";
import { reorderBoardColumnsForUser } from "@/lib/task-columns";

export async function PATCH(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    if (!Array.isArray(body.orderedIds)) {
      throw new ApiError("orderedIds must be an array of strings.", 400);
    }

    const orderedIds: string[] = body.orderedIds.map(String);

    await reorderBoardColumnsForUser(userId, orderedIds);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
