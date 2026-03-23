import { NextResponse } from "next/server";
import { getDashboardContextForUser } from "@/lib/dashboard";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const result = await getDashboardContextForUser(userId);
    if (!result) throw new ApiError("No active organization found.", 403);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
