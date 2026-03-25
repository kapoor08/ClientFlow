import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";
import {
  listBoardColumnsForUser,
  createBoardColumnForUser,
} from "@/lib/task-columns";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const columns = await listBoardColumnsForUser(userId);
    if (columns === null) {
      return NextResponse.json({ columns: [] });
    }
    return NextResponse.json({ columns });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      throw new ApiError("Column name is required.", 400);
    }

    const color = typeof body.color === "string" ? body.color : "#3b82f6";
    const columnType =
      body.columnType !== undefined
        ? typeof body.columnType === "string"
          ? body.columnType === "none"
            ? null
            : body.columnType
          : null
        : null;
    const description =
      body.description !== undefined
        ? typeof body.description === "string"
          ? body.description
          : null
        : null;

    const result = await createBoardColumnForUser(userId, {
      name,
      color,
      columnType,
      description,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
