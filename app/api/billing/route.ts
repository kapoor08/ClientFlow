import { NextResponse } from "next/server";
import { getBillingContextForUser } from "@/server/billing";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import { billingSearchParamsCache } from "@/core/billing/searchParams";

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const { dateFrom, dateTo, page, pageSize } =
      billingSearchParamsCache.parse(Object.fromEntries(searchParams.entries()));

    const result = await getBillingContextForUser(userId, {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page,
      pageSize,
    });
    if (!result) throw new ApiError("No active organization found.", 403);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
