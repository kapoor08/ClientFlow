import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";
import { buildPersonalDataExport } from "@/server/gdpr/personal-export";
import { writeAuditLog } from "@/server/security/audit";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { logger } from "@/server/observability/logger";

/**
 * GDPR Article 20 - Right to data portability.
 *
 * Returns a JSON document containing every row in the database tied to the
 * calling user's id or email. Security-sensitive fields (tokens, secrets,
 * hashes, push keys) are redacted. See `server/gdpr/personal-export.ts`.
 *
 * We also write an audit-log entry so we can prove the request was honored if
 * a regulator ever asks. Best-effort - a failure to audit-log does not block
 * the export.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuth();
    const payload = await buildPersonalDataExport(userId);

    try {
      const ctx = await getOrganizationSettingsContextForUser(userId);
      if (ctx) {
        await writeAuditLog({
          organizationId: ctx.organizationId,
          actorUserId: userId,
          action: "user.data_export_requested",
          entityType: "user",
          entityId: userId,
          ipAddress: request.headers.get("x-real-ip") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
          metadata: { exportVersion: 1 },
        });
      }
    } catch (err) {
      logger.warn("gdpr.export.audit_log_failed", {
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }

    const filename = `clientflow-personal-data-${userId}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
