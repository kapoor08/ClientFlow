import { NextRequest, NextResponse } from "next/server";
import {
  getProjectDetailForUser,
  updateProjectForUser,
  deleteProjectForUser,
} from "@/server/projects";
import { projectFormSchema } from "@/schemas/projects";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const result = await getProjectDetailForUser(userId, id);

    if (!result.access) {
      throw new ApiError("No active organization found.", 403);
    }
    if (!result.project) {
      throw new ApiError("Project not found.", 404);
    }

    return NextResponse.json({ project: result.project });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.dueDate) body.dueDate = new Date(body.dueDate);
    const parsed = projectFormSchema.safeParse(body);

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Invalid request body.";
      throw new ApiError(firstError, 422);
    }

    const result = await updateProjectForUser(userId, id, parsed.data);

    return NextResponse.json({ projectId: result.projectId });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await deleteProjectForUser(userId, id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
