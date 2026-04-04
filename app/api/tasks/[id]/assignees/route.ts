import { NextRequest, NextResponse } from "next/server";
import { updateTaskAssigneesForUser } from "@/lib/task-assignees";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";
import { z } from "zod";

const schema = z.object({ userIds: z.array(z.string()).default([]) });

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError("Invalid request.", 422);

    await updateTaskAssigneesForUser(userId, id, parsed.data.userIds);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
