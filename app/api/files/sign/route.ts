import { NextRequest, NextResponse } from "next/server";
import { getSignedUploadParams, getSignedUploadParamsForFolder } from "@/lib/files";
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json() as { folder?: string; resourceType?: string };
    if (!body.folder) throw new ApiError("folder is required.", 400);

    const params = await getSignedUploadParamsForFolder(userId, body.folder);

    return NextResponse.json(params);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
