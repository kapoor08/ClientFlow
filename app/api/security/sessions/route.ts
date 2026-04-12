import { NextResponse } from "next/server";
import { listSessionsForCurrentUser } from "@/server/security/data";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";

export async function GET() {
  try {
    await requireAuth();
    const result = await listSessionsForCurrentUser();

    if (!result) {
      throw new ApiError("Not authenticated.", 401);
    }

    return NextResponse.json({
      sessions: result.sessions.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
