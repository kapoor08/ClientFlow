import { NextRequest, NextResponse } from "next/server";
import { listActivityForUser } from "@/server/activity";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = request.nextUrl;

    const query = searchParams.get("q") ?? undefined;
    const entityType = searchParams.get("entityType") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE,
    );

    const result = await listActivityForUser(userId, {
      query,
      entityType,
      dateFrom,
      dateTo,
      page,
      pageSize,
    });

    if (!result) throw new ApiError("No active organization found.", 403);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
