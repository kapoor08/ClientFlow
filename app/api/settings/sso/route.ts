import { NextRequest, NextResponse } from "next/server";
import {
  getOrganizationSettingsContextForUser,
  updateSsoConfigForUser,
} from "@/server/organization-settings";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import { updateSsoConfigSchema } from "@/schemas/api-misc";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const ctx = await getOrganizationSettingsContextForUser(userId);
    return NextResponse.json({ ssoConfig: ctx?.ssoConfig ?? null });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = updateSsoConfigSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid SSO config.", 422);
    }
    await updateSsoConfigForUser(userId, parsed.data.ssoConfig);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
