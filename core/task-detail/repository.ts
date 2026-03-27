import { http } from "@/core/infrastructure";
import type {
  TaskDetail,
  TaskComment,
  TaskActivity,
  SubtaskItem,
  TaskAttachment,
  SignedUploadParams,
} from "./entity";

export function getTaskDetail(taskId: string): Promise<TaskDetail> {
  return http<TaskDetail>(`/api/tasks/${taskId}`);
}

export function listComments(taskId: string): Promise<{ comments: TaskComment[] }> {
  return http<{ comments: TaskComment[] }>(`/api/tasks/${taskId}/comments`);
}

export function createComment(
  taskId: string,
  body: string,
): Promise<{ commentId: string }> {
  return http<{ commentId: string }>(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    body: { body },
  });
}

export function updateComment(
  taskId: string,
  commentId: string,
  body: string,
): Promise<void> {
  return http<void>(`/api/tasks/${taskId}/comments/${commentId}`, {
    method: "PATCH",
    body: { body },
  });
}

export function deleteComment(taskId: string, commentId: string): Promise<void> {
  return http<void>(`/api/tasks/${taskId}/comments/${commentId}`, {
    method: "DELETE",
  });
}

export function listActivity(taskId: string): Promise<{ activity: TaskActivity[] }> {
  return http<{ activity: TaskActivity[] }>(`/api/tasks/${taskId}/activity`);
}

// ─── Subtasks ──────────────────────────────────────────────────────────────────

export function listSubtasks(taskId: string): Promise<{ subtasks: SubtaskItem[] }> {
  return http<{ subtasks: SubtaskItem[] }>(`/api/tasks/${taskId}/subtasks`);
}

export function createSubtask(
  taskId: string,
  title: string,
): Promise<{ taskId: string }> {
  return http<{ taskId: string }>(`/api/tasks/${taskId}/subtasks`, {
    method: "POST",
    body: { title },
  });
}

export function toggleSubtask(
  taskId: string,
  subtaskId: string,
): Promise<void> {
  return http<void>(`/api/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
    method: "PATCH",
  });
}

export function deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
  return http<void>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: "DELETE",
  });
}

// ─── Attachments ───────────────────────────────────────────────────────────────

export function listAttachments(
  taskId: string,
): Promise<{ attachments: TaskAttachment[] }> {
  return http<{ attachments: TaskAttachment[] }>(
    `/api/tasks/${taskId}/attachments`,
  );
}

export function getAttachmentSignedParams(
  taskId: string,
): Promise<SignedUploadParams> {
  return http<SignedUploadParams>(`/api/tasks/${taskId}/attachments/sign`);
}

export function saveAttachment(
  taskId: string,
  data: {
    storageKey: string;
    storageUrl: string;
    fileName: string;
    mimeType: string | null;
    sizeBytes: number | null;
  },
): Promise<{ attachmentId: string }> {
  return http<{ attachmentId: string }>(`/api/tasks/${taskId}/attachments`, {
    method: "POST",
    body: data,
  });
}

export function deleteAttachment(
  taskId: string,
  attachmentId: string,
): Promise<void> {
  return http<void>(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
    method: "DELETE",
  });
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
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? "Upload failed.");
  }

  const data = await res.json() as { public_id: string; secure_url: string };
  return { publicId: data.public_id, secureUrl: data.secure_url };
}
