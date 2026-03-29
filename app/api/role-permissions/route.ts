import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import {
  getRolePermissionsForOrg,
  updateRolePermissionsForUser,
} from "@/lib/role-permissions";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import type { RolePermissionsConfig } from "@/config/role-permissions";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const ctx = await getOrganizationSettingsContextForUser(userId);
    if (!ctx) return NextResponse.json({ error: "No organization found." }, { status: 404 });
    const permissions = await getRolePermissionsForOrg(ctx.organizationId);
    return NextResponse.json({ permissions });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json() as { permissions: RolePermissionsConfig };

    if (!body.permissions) {
      return NextResponse.json({ error: "Missing permissions payload." }, { status: 400 });
    }

    await updateRolePermissionsForUser(userId, body.permissions);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update permissions.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
