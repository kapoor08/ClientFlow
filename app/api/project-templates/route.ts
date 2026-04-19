import { NextRequest, NextResponse } from "next/server";
import { listProjectTemplatesForUser, createProjectTemplateForUser } from "@/server/project-templates";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import { createProjectTemplateSchema } from "@/schemas/project-templates";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const templates = await listProjectTemplatesForUser(userId);
    if (!templates) throw new ApiError("No active organization found.", 403);
    return NextResponse.json({
      templates: templates.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = createProjectTemplateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    }
    const template = await createProjectTemplateForUser(userId, parsed.data);
    return NextResponse.json(
      { ...template, createdAt: template.createdAt.toISOString(), updatedAt: template.updatedAt.toISOString() },
      { status: 201 },
    );
  } catch (err) {
    return apiErrorResponse(err);
  }
}
