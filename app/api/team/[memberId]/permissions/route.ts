import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import { updateMemberPermissionOverridesForUser } from "@/server/team";
import { updateMemberPermissionsSchema } from "@/schemas/api-misc";

type RouteContext = { params: Promise<{ memberId: string }> };

/** PATCH /api/team/[memberId]/permissions - set or clear member-level permission overrides */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { memberId } = await params;
    const body = await request.json();
    const parsed = updateMemberPermissionsSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid overrides payload.", 422);
    }

    await updateMemberPermissionOverridesForUser(userId, memberId, parsed.data.overrides);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
