import { NextRequest, NextResponse } from "next/server";
import { deleteTaskAttachment } from "@/server/task-attachments";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";

type RouteContext = { params: Promise<{ id: string; attachmentId: string }> };

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { userId } = await requireAuth();
    const { attachmentId } = await params;

    await deleteTaskAttachment(userId, attachmentId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
