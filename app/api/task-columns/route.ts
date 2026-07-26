import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import { DEFAULT_COLUMN_COLOR } from "@/constants/colors";
import {
  listBoardColumnsForUser,
  createBoardColumnForUser,
} from "@/server/task-columns";
import { createTaskColumnSchema } from "@/schemas/api-misc";

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
    const parsed = createTaskColumnSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid column input.", 422);
    }

    const { name, color = DEFAULT_COLUMN_COLOR, columnType, description } = parsed.data;
    const result = await createBoardColumnForUser(userId, {
      name,
      color,
      columnType: columnType === "none" ? null : columnType ?? null,
      description: description ?? null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
