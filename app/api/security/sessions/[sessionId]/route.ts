import { NextRequest, NextResponse } from "next/server";
import { revokeSessionForCurrentUser } from "@/lib/security";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { sessionId } = await params;
    await revokeSessionForCurrentUser(sessionId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
