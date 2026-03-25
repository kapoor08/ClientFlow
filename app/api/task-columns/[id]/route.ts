import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";
import {
  updateBoardColumnForUser,
  deleteBoardColumnForUser,
} from "@/lib/task-columns";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { id: columnId } = await params;
    const body = await request.json();

    const input: {
      name?: string;
      color?: string;
      columnType?: string | null;
      description?: string | null;
    } = {};

    if (body.name !== undefined) input.name = String(body.name);
    if (body.color !== undefined) input.color = String(body.color);
    if (body.columnType !== undefined) {
      input.columnType =
        body.columnType === "none" || body.columnType === null
          ? null
          : String(body.columnType);
    }
    if (body.description !== undefined) {
      input.description =
        body.description === null ? null : String(body.description);
    }

    await updateBoardColumnForUser(userId, columnId, input);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { id: columnId } = await params;

    await deleteBoardColumnForUser(userId, columnId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
