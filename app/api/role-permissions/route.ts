import { NextResponse } from "next/server";
import { requireAuth } from "@/server/api/helpers";
import {
  getRolePermissionsForOrg,
  updateRolePermissionsForUser,
} from "@/server/auth/permissions";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { updateRolePermissionsSchema } from "@/schemas/api-misc";

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
    const body = await request.json();
    const parsed = updateRolePermissionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid permissions payload." },
        { status: 422 },
      );
    }

    await updateRolePermissionsForUser(userId, parsed.data.permissions);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update permissions.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
