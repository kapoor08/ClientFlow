import { NextRequest, NextResponse } from "next/server";
import {
  getOrganizationSettingsContextForUser,
  updateSecurityPoliciesForUser,
} from "@/lib/organization-settings";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const ctx = await getOrganizationSettingsContextForUser(userId);
    if (!ctx) return NextResponse.json({ sessionTimeoutHours: null, ipAllowlist: [] });
    return NextResponse.json({
      sessionTimeoutHours: ctx.sessionTimeoutHours,
      ipAllowlist: ctx.ipAllowlist ?? [],
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    await updateSecurityPoliciesForUser(userId, {
      sessionTimeoutHours: body?.sessionTimeoutHours ?? undefined,
      ipAllowlist: body?.ipAllowlist ?? undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
