import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import {
  cancelDeletion,
  getDeletionBlockers,
  getDeletionStatus,
  scheduleDeletion,
} from "@/server/account/deletion";
import { writeAuditLog } from "@/server/security/audit";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { logger } from "@/server/observability/logger";

/**
 * GET    - current deletion status + any blockers
 * POST   - schedule deletion (body: { confirm: "DELETE" })
 * DELETE - cancel a scheduled deletion
 *
 * All three require a session. Rate limits from the global `/api/*` bucket
 * apply (120/60s per IP).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const [status, blockers] = await Promise.all([
      getDeletionStatus(userId),
      getDeletionBlockers(userId),
    ]);
    return NextResponse.json({ status, blockers });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();

    const body = (await request.json().catch(() => ({}))) as {
      confirm?: string;
    };
    if (body.confirm !== "DELETE") {
      throw new ApiError('Confirmation required. Send { confirm: "DELETE" }.', 400);
    }

    const blockers = await getDeletionBlockers(userId);
    if (blockers.length > 0) {
      return NextResponse.json({ error: "blocked", blockers }, { status: 409 });
    }

    const { scheduledFor } = await scheduleDeletion(userId);

    try {
      const ctx = await getOrganizationSettingsContextForUser(userId);
      if (ctx) {
        await writeAuditLog({
          organizationId: ctx.organizationId,
          actorUserId: userId,
          action: "user.deletion_scheduled",
          entityType: "user",
          entityId: userId,
          ipAddress: request.headers.get("x-real-ip") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
          metadata: { scheduledFor: scheduledFor.toISOString() },
        });
      }
    } catch (err) {
      logger.warn("account.deletion.audit_log_failed", {
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }

    return NextResponse.json({ scheduled: true, scheduledFor });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await requireAuth();
    await cancelDeletion(userId);

    try {
      const ctx = await getOrganizationSettingsContextForUser(userId);
      if (ctx) {
        await writeAuditLog({
          organizationId: ctx.organizationId,
          actorUserId: userId,
          action: "user.deletion_cancelled",
          entityType: "user",
          entityId: userId,
          ipAddress: request.headers.get("x-real-ip") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
        });
      }
    } catch (err) {
      logger.warn("account.deletion.audit_log_failed", {
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }

    return NextResponse.json({ cancelled: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
