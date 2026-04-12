import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { db } from "@/server/db/client";
import { taskAttachments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { cloudinary } from "@/server/third-party/cloudinary";

/**
 * Cloudinary URL format:
 *   https://res.cloudinary.com/{cloud}/{resource_type}/{delivery_type}/...
 */
function parseCloudinaryMeta(url: string): {
  resourceType: string;
  deliveryType: string;
} {
  try {
    const { pathname } = new URL(url);
    const parts = pathname.split("/").filter(Boolean);
    return {
      resourceType: parts[1] ?? "image",  // image | video | raw
      deliveryType: parts[2] ?? "upload", // upload | authenticated | private
    };
  } catch {
    return { resourceType: "image", deliveryType: "upload" };
  }
}

/**
 * GET /api/tasks/attachments/proxy?id=<attachmentId>
 *
 * Uses cloudinary.utils.private_download_url() to generate an HMAC-signed
 * API download URL (api.cloudinary.com/v1_1/.../download?...) which bypasses
 * CDN delivery restrictions entirely. The signature is validated by Cloudinary's
 * API servers, not the CDN, so authenticated/private resources are always
 * accessible.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const attachmentId = request.nextUrl.searchParams.get("id");
    if (!attachmentId) throw new ApiError("Missing id parameter.", 400);

    const context = await getOrganizationSettingsContextForUser(userId);
    if (!context) throw new ApiError("No active organization found.", 403);

    const [attachment] = await db
      .select({
        storageKey: taskAttachments.storageKey,
        storageUrl: taskAttachments.storageUrl,
        mimeType: taskAttachments.mimeType,
        fileName: taskAttachments.fileName,
      })
      .from(taskAttachments)
      .where(
        and(
          eq(taskAttachments.id, attachmentId),
          eq(taskAttachments.organizationId, context.organizationId),
        ),
      )
      .limit(1);

    if (!attachment) throw new ApiError("Attachment not found.", 404);
    if (!attachment.storageUrl || !attachment.storageKey) {
      throw new ApiError("Attachment has no URL.", 404);
    }

    const { resourceType, deliveryType } = parseCloudinaryMeta(
      attachment.storageUrl,
    );

    // Extract file extension from the stored file name for the format param.
    const ext = attachment.fileName?.split(".").pop() ?? "";

    // private_download_url generates:
    //   https://api.cloudinary.com/v1_1/{cloud}/{resource_type}/download
    //     ?public_id=...&format=...&api_key=...&timestamp=...&signature=...
    // This goes through Cloudinary's API servers (not CDN), so it works for
    // all delivery types (upload, authenticated, private) with no 401.
    const downloadUrl = cloudinary.utils.private_download_url(
      attachment.storageKey,
      ext,
      {
        resource_type: resourceType as "image" | "video" | "raw",
        type: deliveryType,
        expires_at: Math.floor(Date.now() / 1000) + 300,
        attachment: false,
      },
    );

    const upstream = await fetch(downloadUrl);
    if (!upstream.ok) {
      throw new ApiError(`Upstream fetch failed: ${upstream.status}`, 502);
    }

    const contentType =
      attachment.mimeType ??
      upstream.headers.get("content-type") ??
      "application/octet-stream";

    const safeFileName = encodeURIComponent(attachment.fileName ?? "file");

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${safeFileName}`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
