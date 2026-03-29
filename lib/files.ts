import "server-only";

import { writeAuditLog } from "@/lib/audit";
import { and, asc, count, desc, eq, ilike } from "drizzle-orm";
import { clients, projectFiles, projects } from "@/db/schema";
import {
  DEFAULT_PAGE_SIZE,
  buildPaginationMeta,
  paginationOffset,
  type PaginationMeta,
} from "@/lib/pagination";
import { db } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { dispatchNotification, getOrgMemberUserIds } from "@/lib/notifications";
import {
  enforceFilesPerProjectCap,
  enforceFileUploadLimit,
} from "@/lib/plan-enforcement";

export type FilesModuleAccess = {
  organizationId: string;
  canWrite: boolean;
};

export type ProjectFile = {
  id: string;
  projectId: string;
  storageKey: string;
  storageUrl: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: Date;
};

export type OrgFileListItem = {
  id: string;
  projectId: string;
  projectName: string;
  clientId: string | null;
  clientName: string | null;
  storageUrl: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: Date;
};

export type SaveFileInput = {
  projectId: string;
  storageKey: string;
  storageUrl: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

export async function getFilesModuleAccessForUser(
  userId: string,
): Promise<FilesModuleAccess | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;
  return {
    organizationId: context.organizationId,
    canWrite: context.roleKey !== "client",
  };
}

export async function listFilesForProject(
  userId: string,
  projectId: string,
): Promise<{ access: FilesModuleAccess | null; files: ProjectFile[] }> {
  const access = await getFilesModuleAccessForUser(userId);
  if (!access) return { access: null, files: [] };

  // Verify the project belongs to this org
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, access.organizationId),
      ),
    )
    .limit(1);

  if (!project) return { access, files: [] };

  const rows = await db
    .select({
      id: projectFiles.id,
      projectId: projectFiles.projectId,
      storageKey: projectFiles.storageKey,
      storageUrl: projectFiles.storageUrl,
      fileName: projectFiles.fileName,
      mimeType: projectFiles.mimeType,
      sizeBytes: projectFiles.sizeBytes,
      createdAt: projectFiles.createdAt,
    })
    .from(projectFiles)
    .where(eq(projectFiles.projectId, projectId))
    .orderBy(asc(projectFiles.createdAt));

  return { access, files: rows };
}

export async function listAllFilesForUser(
  userId: string,
  options: { query?: string; page?: number; pageSize?: number } = {},
): Promise<{
  access: FilesModuleAccess | null;
  files: OrgFileListItem[];
  pagination: PaginationMeta;
}> {
  const access = await getFilesModuleAccessForUser(userId);
  const emptyPagination = buildPaginationMeta(0, 1, DEFAULT_PAGE_SIZE);
  if (!access) return { access: null, files: [], pagination: emptyPagination };

  const { query = "", page = 1, pageSize = DEFAULT_PAGE_SIZE } = options;
  const trimmedQuery = query.trim();

  const whereClause = and(
    eq(projectFiles.organizationId, access.organizationId),
    trimmedQuery ? ilike(projectFiles.fileName, `%${trimmedQuery}%`) : undefined,
  );

  const [{ total }] = await db
    .select({ total: count() })
    .from(projectFiles)
    .where(whereClause);

  const rows = await db
    .select({
      id: projectFiles.id,
      projectId: projectFiles.projectId,
      projectName: projects.name,
      clientId: projects.clientId,
      clientName: clients.name,
      storageUrl: projectFiles.storageUrl,
      fileName: projectFiles.fileName,
      mimeType: projectFiles.mimeType,
      sizeBytes: projectFiles.sizeBytes,
      createdAt: projectFiles.createdAt,
    })
    .from(projectFiles)
    .innerJoin(projects, eq(projectFiles.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(whereClause)
    .orderBy(desc(projectFiles.createdAt))
    .limit(pageSize)
    .offset(paginationOffset(page, pageSize));

  return {
    access,
    files: rows,
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}

export async function saveFileForUser(
  userId: string,
  input: SaveFileInput,
): Promise<{ fileId: string }> {
  const access = await getFilesModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");
  if (!access.canWrite) throw new Error("You do not have permission to upload files.");

  // Verify project belongs to org and get project name for notification
  const [project] = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(
      and(
        eq(projects.id, input.projectId),
        eq(projects.organizationId, access.organizationId),
      ),
    )
    .limit(1);

  if (!project) throw new Error("Project not found.");

  await enforceFilesPerProjectCap(access.organizationId, input.projectId);
  await enforceFileUploadLimit(access.organizationId);

  const fileId = crypto.randomUUID();

  await db.insert(projectFiles).values({
    id: fileId,
    organizationId: access.organizationId,
    projectId: input.projectId,
    uploadedByUserId: userId,
    storageProvider: "cloudinary",
    storageKey: input.storageKey,
    storageUrl: input.storageUrl,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
  });

  writeAuditLog({
    organizationId: access.organizationId,
    actorUserId: userId,
    action: "file.uploaded",
    entityType: "file",
    entityId: fileId,
    metadata: { name: input.fileName },
  }).catch(console.error);

  // Notify all org members about the upload (awaited so notification is in DB before response)
  const memberIdsForFile = await getOrgMemberUserIds(access.organizationId);
  await dispatchNotification({
    organizationId: access.organizationId,
    recipientUserIds: memberIdsForFile,
    eventKey: "shared_file_uploaded",
    title: `New file uploaded to "${project.name}"`,
    body: input.fileName,
    url: `/projects/${input.projectId}`,
  });

  return { fileId };
}

export async function deleteFileForUser(
  userId: string,
  fileId: string,
): Promise<void> {
  const access = await getFilesModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");
  if (!access.canWrite) throw new Error("You do not have permission to delete files.");

  const [file] = await db
    .select({ id: projectFiles.id, storageKey: projectFiles.storageKey, mimeType: projectFiles.mimeType, fileName: projectFiles.fileName })
    .from(projectFiles)
    .where(
      and(
        eq(projectFiles.id, fileId),
        eq(projectFiles.organizationId, access.organizationId),
      ),
    )
    .limit(1);

  if (!file) throw new Error("File not found.");

  // Determine Cloudinary resource type from mime type
  const resourceType = file.mimeType?.startsWith("image/")
    ? "image"
    : file.mimeType?.startsWith("video/")
      ? "video"
      : "raw";

  await cloudinary.uploader.destroy(file.storageKey, { resource_type: resourceType });
  await db.delete(projectFiles).where(eq(projectFiles.id, fileId));

  writeAuditLog({
    organizationId: access.organizationId,
    actorUserId: userId,
    action: "file.deleted",
    entityType: "file",
    entityId: fileId,
    metadata: { name: file.fileName },
  }).catch(console.error);
}

export async function getSignedUploadParams(
  userId: string,
  projectId: string,
): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}> {
  const access = await getFilesModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");
  if (!access.canWrite) throw new Error("You do not have permission to upload files.");

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `clientflow/${access.organizationId}/projects/${projectId}`;

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

/**
 * Generates a Cloudinary signed upload for a named folder (e.g. org-logos).
 * Used by the branding settings page. Scoped to the user's organization.
 */
export async function getSignedUploadParamsForFolder(
  userId: string,
  folderName: string,
): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}> {
  const access = await getFilesModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");
  if (!access.canWrite) throw new Error("You do not have permission to upload files.");

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `clientflow/${access.organizationId}/${folderName}`;

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
