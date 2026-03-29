import { NextRequest, NextResponse } from "next/server";
import { updateProjectTemplateForUser, deleteProjectTemplateForUser } from "@/lib/project-templates";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ templateId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { templateId } = await params;
    const body = await request.json();
    await updateProjectTemplateForUser(userId, templateId, {
      name: body?.name,
      description: body?.description,
      defaultStatus: body?.defaultStatus,
      defaultPriority: body?.defaultPriority,
      tasks: body?.tasks,
    });
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
