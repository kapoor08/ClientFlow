import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSummaryForUser } from "@/server/analytics";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = request.nextUrl;

    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    const clientId = searchParams.get("clientId") ?? undefined;
    const priority = searchParams.get("priority") ?? undefined;

    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
    const dateTo = dateToParam ? new Date(dateToParam) : undefined;

    const summary = await getAnalyticsSummaryForUser(userId, {
      dateFrom,
      dateTo,
      clientId,
      priority,
    });

    if (!summary) {
      throw new ApiError("No active organization found.", 403);
    }

    return NextResponse.json({ summary });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
