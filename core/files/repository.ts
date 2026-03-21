import { http } from "@/core/infrastructure";
import type {
  FileListResponse,
  FileMutationResponse,
  OrgFileListResponse,
  SaveFileInput,
  SignedUploadParams,
} from "./entity";

export async function getSignedUploadParams(
  projectId: string,
): Promise<SignedUploadParams> {
  return http<SignedUploadParams>(`/api/files/sign?projectId=${projectId}`);
}

export async function listFiles(projectId: string): Promise<FileListResponse> {
  return http<FileListResponse>(`/api/files?projectId=${projectId}`);
}

export async function listAllFiles(params: {
  q?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<OrgFileListResponse> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  return http<OrgFileListResponse>(`/api/files${qs.toString() ? `?${qs}` : ""}`);
}

export async function saveFile(
  data: SaveFileInput,
): Promise<FileMutationResponse> {
  return http<FileMutationResponse>("/api/files", { method: "POST", body: data });
}

export async function deleteFile(fileId: string): Promise<void> {
  return http<void>(`/api/files/${fileId}`, { method: "DELETE" });
}

export async function uploadToCloudinary(
  file: File,
  params: SignedUploadParams,
): Promise<{ publicId: string; secureUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", params.apiKey);
  formData.append("timestamp", String(params.timestamp));
  formData.append("signature", params.signature);
  formData.append("folder", params.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${params.cloudName}/auto/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ??
        "Cloudinary upload failed.",
    );
  }

  const data = await res.json() as { public_id: string; secure_url: string };
  return { publicId: data.public_id, secureUrl: data.secure_url };
}
