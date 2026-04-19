import { NextRequest, NextResponse } from "next/server";
import { updateProjectTemplateForUser, deleteProjectTemplateForUser } from "@/server/project-templates";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import { updateProjectTemplateSchema } from "@/schemas/project-templates";

type Params = { params: Promise<{ templateId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { templateId } = await params;
    const body = await request.json();
    const parsed = updateProjectTemplateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    }
    await updateProjectTemplateForUser(userId, templateId, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { templateId } = await params;
    await deleteProjectTemplateForUser(userId, templateId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
