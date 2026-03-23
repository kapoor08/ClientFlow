import { NextRequest, NextResponse } from "next/server";
import { listAuditLogsForUser } from "@/lib/audit";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = request.nextUrl;

    const query = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE);

    const result = await listAuditLogsForUser(userId, { query, page, pageSize });

    if (!result) {
      throw new ApiError("Access denied.", 403);
    }

    return NextResponse.json({
      logs: result.logs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: result.pagination,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
