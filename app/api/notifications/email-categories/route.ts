import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getCategoryPreferences,
  setCategoryPreferences,
} from "@/server/email/category-preferences";
import { ApiError, apiErrorResponse, requireAuth } from "@/server/api/helpers";
import { getServerSession } from "@/server/auth/session";
import { writeAuditLog } from "@/server/security/audit";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { logger } from "@/server/observability/logger";

const patchSchema = z.object({
  productOptIn: z.boolean().optional(),
  billingOptIn: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
});

async function getCurrentUserEmail(): Promise<string> {
  const session = await getServerSession();
  if (!session?.user?.email) throw new ApiError("Unauthorized.", 401);
  return session.user.email;
}

export async function GET() {
  try {
    await requireAuth();
    const email = await getCurrentUserEmail();
    const prefs = await getCategoryPreferences(email);
    return NextResponse.json(prefs);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const email = await getCurrentUserEmail();
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Invalid preferences payload.", 422);
    }
    const previous = await getCategoryPreferences(email);
    const next = await setCategoryPreferences(email, parsed.data);

    // Audit-log preference changes - GDPR + DPA reviews want a trail of who
    // toggled what and when. Best-effort: log failures don't block the user.
    try {
      const ctx = await getOrganizationSettingsContextForUser(userId);
      if (ctx) {
        await writeAuditLog({
          organizationId: ctx.organizationId,
          actorUserId: userId,
          action: "user.email_preferences_updated",
          entityType: "user",
          entityId: userId,
          ipAddress: request.headers.get("x-real-ip") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
          metadata: { previous, next, changed: parsed.data },
        });
      }
    } catch (err) {
      logger.warn("email_preferences.audit_log_failed", {
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }

    return NextResponse.json(next);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
