import { NextRequest, NextResponse } from "next/server";
import { getSignedUploadParamsForTask } from "@/lib/task-attachments";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const signedParams = await getSignedUploadParamsForTask(userId, id);
    return NextResponse.json(signedParams);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
