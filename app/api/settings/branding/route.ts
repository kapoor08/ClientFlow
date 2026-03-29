import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";
import { updateOrganizationBrandingForUser } from "@/lib/organization-settings";

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    const saved = await updateOrganizationBrandingForUser(userId, {
      logoUrl: typeof body.logoUrl === "string" ? body.logoUrl || null : undefined,
      brandColor: typeof body.brandColor === "string" ? body.brandColor || null : undefined,
    });

    // Invalidate the full layout so the sidebar re-fetches the new logo/color
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true, logoUrl: saved.logoUrl, brandColor: saved.brandColor });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
