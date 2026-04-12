import { NextRequest, NextResponse } from "next/server";
import { listTaskAttachments, saveTaskAttachment } from "@/server/task-attachments";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const saveSchema = z.object({
  storageKey: z.string().min(1),
  storageUrl: z.string().url(),
  fileName: z.string().min(1),
  mimeType: z.string().nullable().default(null),
  sizeBytes: z.number().int().positive().nullable().default(null),
});

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const attachments = await listTaskAttachments(userId, id);
    if (!attachments) throw new ApiError("Task not found.", 404);

    return NextResponse.json({ attachments });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request.";
      throw new ApiError(firstError, 422);
    }

    const result = await saveTaskAttachment(userId, id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
