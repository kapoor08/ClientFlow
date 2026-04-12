import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { tasks, taskAttachments, taskAuditLogs } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { db } from "@/server/db/client";
import { cloudinary } from "@/server/third-party/cloudinary";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";

export type TaskAttachmentItem = {
  id: string;
  storageKey: string;
  storageUrl: string | null;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploaderName: string | null;
  createdAt: Date;
};

export type SaveAttachmentInput = {
  storageKey: string;
  storageUrl: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

async function verifyTaskAccess(
  userId: string,
  taskId: string,
): Promise<{ organizationId: string } | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.organizationId, context.organizationId),
        isNull(tasks.deletedAt),
      ),
    )
    .limit(1);

  if (!task) return null;
  return { organizationId: context.organizationId };
}

export async function listTaskAttachments(
  userId: string,
  taskId: string,
): Promise<TaskAttachmentItem[] | null> {
  const access = await verifyTaskAccess(userId, taskId);
  if (!access) return null;

  const rows = await db
    .select({
      id: taskAttachments.id,
      storageKey: taskAttachments.storageKey,
      storageUrl: taskAttachments.storageUrl,
      fileName: taskAttachments.fileName,
      mimeType: taskAttachments.mimeType,
      sizeBytes: taskAttachments.sizeBytes,
      uploaderName: user.name,
      createdAt: taskAttachments.createdAt,
    })
    .from(taskAttachments)
    .leftJoin(user, eq(taskAttachments.uploadedByUserId, user.id))
    .where(eq(taskAttachments.taskId, taskId))
    .orderBy(asc(taskAttachments.createdAt));

  return rows;
}

export async function saveTaskAttachment(
  userId: string,
  taskId: string,
  input: SaveAttachmentInput,
): Promise<{ attachmentId: string }> {
  const access = await verifyTaskAccess(userId, taskId);
  if (!access) throw new Error("Task not found.");

  const attachmentId = crypto.randomUUID();

  await db.insert(taskAttachments).values({
    id: attachmentId,
    organizationId: access.organizationId,
    taskId,
    uploadedByUserId: userId,
    storageProvider: "cloudinary",
    storageKey: input.storageKey,
    storageUrl: input.storageUrl,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
  });

  db.insert(taskAuditLogs)
    .values({
      id: crypto.randomUUID(),
      organizationId: access.organizationId,
      taskId,
      actorUserId: userId,
      action: "attachment.added",
      newValues: { fileName: input.fileName, attachmentId },
    })
    .catch(console.error);

  return { attachmentId };
}

export async function deleteTaskAttachment(
  userId: string,
  attachmentId: string,
): Promise<void> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");

  const [attachment] = await db
    .select({
      id: taskAttachments.id,
      taskId: taskAttachments.taskId,
      storageKey: taskAttachments.storageKey,
      fileName: taskAttachments.fileName,
      mimeType: taskAttachments.mimeType,
    })
    .from(taskAttachments)
    .where(
      and(
        eq(taskAttachments.id, attachmentId),
        eq(taskAttachments.organizationId, context.organizationId),
      ),
    )
    .limit(1);

  if (!attachment) throw new Error("Attachment not found.");

  const resourceType = attachment.mimeType?.startsWith("image/")
    ? "image"
    : attachment.mimeType?.startsWith("video/")
      ? "video"
      : "raw";

  await cloudinary.uploader.destroy(attachment.storageKey, {
    resource_type: resourceType,
  });
  await db
    .delete(taskAttachments)
    .where(eq(taskAttachments.id, attachmentId));

  db.insert(taskAuditLogs)
    .values({
      id: crypto.randomUUID(),
      organizationId: context.organizationId,
      taskId: attachment.taskId,
      actorUserId: userId,
      action: "attachment.deleted",
      oldValues: { fileName: attachment.fileName, attachmentId },
    })
    .catch(console.error);
}

export async function getSignedUploadParamsForTask(
  userId: string,
  taskId: string,
): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}> {
  const access = await verifyTaskAccess(userId, taskId);
  if (!access) throw new Error("Task not found.");

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `clientflow/${access.organizationId}/tasks/${taskId}`;

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}
