import { NextRequest, NextResponse } from "next/server";
import {
  updateMemberRoleForUser,
  updateMemberStatusForUser,
  removeMemberForUser,
} from "@/lib/team";
import { writeAuditLog } from "@/lib/audit";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";

type RouteContext = { params: Promise<{ memberId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { memberId } = await params;
    const body = await request.json();
    const action = body?.action as string | undefined;

    const ctx = await getOrganizationSettingsContextForUser(userId);
    const orgId = ctx?.organizationId;
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined;
    const ua = request.headers.get("user-agent") ?? undefined;

    if (action === "change-role") {
      const roleKey = body?.roleKey as string | undefined;
      if (!roleKey) throw new ApiError("roleKey is required.", 422);
      await updateMemberRoleForUser(userId, memberId, roleKey);
      if (orgId) writeAuditLog({ organizationId: orgId, actorUserId: userId, action: "member.role_changed", entityType: "membership", entityId: memberId, metadata: { newRoleKey: roleKey }, ipAddress: ip, userAgent: ua }).catch(console.error);
      return NextResponse.json({ ok: true });
    }

    if (action === "suspend") {
      await updateMemberStatusForUser(userId, memberId, "suspended");
      if (orgId) writeAuditLog({ organizationId: orgId, actorUserId: userId, action: "member.suspended", entityType: "membership", entityId: memberId, ipAddress: ip, userAgent: ua }).catch(console.error);
      return NextResponse.json({ ok: true });
    }

    if (action === "reactivate") {
      await updateMemberStatusForUser(userId, memberId, "active");
      if (orgId) writeAuditLog({ organizationId: orgId, actorUserId: userId, action: "member.reactivated", entityType: "membership", entityId: memberId, ipAddress: ip, userAgent: ua }).catch(console.error);
      return NextResponse.json({ ok: true });
    }

    throw new ApiError("Unknown action.", 422);
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { memberId } = await params;
    const ctx = await getOrganizationSettingsContextForUser(userId);
    await removeMemberForUser(userId, memberId);
    if (ctx?.organizationId) {
      const ip = request.headers.get("x-forwarded-for") ?? undefined;
      const ua = request.headers.get("user-agent") ?? undefined;
      writeAuditLog({ organizationId: ctx.organizationId, actorUserId: userId, action: "member.removed", entityType: "membership", entityId: memberId, ipAddress: ip, userAgent: ua }).catch(console.error);
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
