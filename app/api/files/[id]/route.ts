import { NextRequest, NextResponse } from "next/server";
import { deleteFileForUser } from "@/server/files";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await deleteFileForUser(userId, id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
