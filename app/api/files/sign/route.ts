import { NextRequest, NextResponse } from "next/server";
import { getSignedUploadParams } from "@/lib/files";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) throw new ApiError("projectId is required.", 400);

    const params = await getSignedUploadParams(userId, projectId);

    return NextResponse.json(params);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
