import { NextRequest, NextResponse } from "next/server";
import {
  getOrganizationSettingsContextForUser,
  updateSsoConfigForUser,
} from "@/lib/organization-settings";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";

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
    await updateSsoConfigForUser(userId, body?.ssoConfig ?? null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
