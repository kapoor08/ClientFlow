import { NextResponse } from "next/server";
import { getAssignableRolesForUser } from "@/server/invitations";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const result = await getAssignableRolesForUser(userId);
    if (!result.access) throw new ApiError("No active organization found.", 403);
    return NextResponse.json({ roles: result.roles });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
