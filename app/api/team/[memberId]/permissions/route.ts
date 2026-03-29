import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";
import { updateMemberPermissionOverridesForUser } from "@/lib/team";
import type { MemberPermissionOverrides } from "@/config/role-permissions";

type RouteContext = { params: Promise<{ memberId: string }> };

/** PATCH /api/team/[memberId]/permissions — set or clear member-level permission overrides */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { memberId } = await params;
    const body = await request.json() as { overrides: MemberPermissionOverrides | null };

    await updateMemberPermissionOverridesForUser(userId, memberId, body.overrides ?? null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
