import { NextResponse } from "next/server";
import { listTeamMembersForUser } from "@/lib/team";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const result = await listTeamMembersForUser(userId);

    if (!result.access) {
      throw new ApiError("No active organization found.", 403);
    }

    return NextResponse.json({
      access: {
        canManage: result.access.canManage,
        roleKey: result.access.roleKey,
        currentUserId: result.access.userId,
      },
      members: result.members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt?.toISOString() ?? null,
      })),
      assignableRoles: result.assignableRoles,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
