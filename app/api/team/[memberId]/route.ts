import { NextRequest, NextResponse } from "next/server";
import {
  updateMemberRoleForUser,
  updateMemberStatusForUser,
  removeMemberForUser,
} from "@/server/team";
import { writeAuditLog } from "@/server/security/audit";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { onRoleChanged } from "@/server/email/triggers";
import { db } from "@/server/db/client";
import { eq } from "drizzle-orm";
import { organizationMemberships, organizations, roles } from "@/db/schema";
import { user } from "@/db/auth-schema";

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

      // Capture old role before update for email trigger
      const [memberBefore] = await db
        .select({ userId: organizationMemberships.userId, roleId: organizationMemberships.roleId })
        .from(organizationMemberships)
        .where(eq(organizationMemberships.id, memberId))
        .limit(1);

      await updateMemberRoleForUser(userId, memberId, roleKey);
      if (orgId) writeAuditLog({ organizationId: orgId, actorUserId: userId, action: "member.role_changed", entityType: "membership", entityId: memberId, metadata: { newRoleKey: roleKey }, ipAddress: ip, userAgent: ua }).catch(console.error);

      // Email trigger: notify the member of their role change
      if (memberBefore && orgId) {
        Promise.all([
          db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, memberBefore.userId)).limit(1),
          db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1),
          db.select({ id: organizations.id, name: organizations.name }).from(organizations).where(eq(organizations.id, orgId)).limit(1),
          db.select({ name: roles.name }).from(roles).where(eq(roles.id, memberBefore.roleId)).limit(1),
          db.select({ name: roles.name }).from(roles).where(eq(roles.key, roleKey)).limit(1),
        ]).then(([memberRows, actorRows, orgRows, oldRoleRows, newRoleRows]) => {
          const member = memberRows[0];
          const actor = actorRows[0];
          const org = orgRows[0];
          if (!member?.email || !actor?.email || !org) return;
          return onRoleChanged({
            member: { id: memberBefore.userId, name: member.name ?? "Team member", email: member.email },
            org: { id: orgId!, name: org.name },
            actor: { id: userId, name: actor.name ?? "An admin", email: actor.email },
            oldRole: oldRoleRows?.[0]?.name ?? roleKey,
            newRole: newRoleRows?.[0]?.name ?? roleKey,
          });
        }).catch(console.error);
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "suspend") {
      await updateMemberStatusForUser(userId, memberId, "suspended");
      return NextResponse.json({ ok: true });
    }

    if (action === "reactivate") {
      await updateMemberStatusForUser(userId, memberId, "active");
      return NextResponse.json({ ok: true });
    }

    throw new ApiError("Unknown action.", 422);
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { memberId } = await params;
    await removeMemberForUser(userId, memberId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
