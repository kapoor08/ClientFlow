import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  getTaskDetail,
  listComments,
  createComment,
  updateComment,
  deleteComment,
  listActivity,
  listSubtasks,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  listAttachments,
  getAttachmentSignedParams,
  saveAttachment,
  deleteAttachment,
  uploadToCloudinary,
} from "./repository";
import type {
  TaskDetail,
  TaskComment,
  TaskActivity,
  SubtaskItem,
  TaskAttachment,
} from "./entity";
import type { HttpError } from "@/core/infrastructure";
import { taskKeys } from "@/core/tasks/useCase";

export const taskDetailKeys = {
  detail: (taskId: string) => ["task-detail", taskId] as const,
  comments: (taskId: string) => ["task-comments", taskId] as const,
  activity: (taskId: string) => ["task-activity", taskId] as const,
  subtasks: (taskId: string) => ["task-subtasks", taskId] as const,
  attachments: (taskId: string) => ["task-attachments", taskId] as const,
};

export function useTaskDetail(
  taskId: string | null,
): UseQueryResult<TaskDetail> {
  return useQuery({
    queryKey: taskDetailKeys.detail(taskId ?? ""),
    queryFn: () => getTaskDetail(taskId!),
    enabled: !!taskId,
    staleTime: 15 * 1000,
  });
}

export function useTaskComments(
  taskId: string | null,
): UseQueryResult<{ comments: TaskComment[] }> {
  return useQuery({
    queryKey: taskDetailKeys.comments(taskId ?? ""),
    queryFn: () => listComments(taskId!),
    enabled: !!taskId,
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000,
  });
}

export function useTaskActivity(
  taskId: string | null,
): UseQueryResult<{ activity: TaskActivity[] }> {
  return useQuery({
    queryKey: taskDetailKeys.activity(taskId ?? ""),
    queryFn: () => listActivity(taskId!),
    enabled: !!taskId,
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000,
  });
}

export function useCreateComment(
  taskId: string,
): UseMutationResult<{ commentId: string }, HttpError, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => createComment(taskId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskDetailKeys.comments(taskId) });
      qc.invalidateQueries({ queryKey: taskDetailKeys.activity(taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateComment(
  taskId: string,
): UseMutationResult<void, HttpError, { commentId: string; body: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }) => updateComment(taskId, commentId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskDetailKeys.comments(taskId) }),
  });
}

export function useDeleteComment(
  taskId: string,
): UseMutationResult<void, HttpError, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(taskId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskDetailKeys.comments(taskId) }),
  });
}

// ─── Subtask hooks ─────────────────────────────────────────────────────────────

export function useSubtasks(
  taskId: string | null,
): UseQueryResult<{ subtasks: SubtaskItem[] }> {
  return useQuery({
    queryKey: taskDetailKeys.subtasks(taskId ?? ""),
    queryFn: () => listSubtasks(taskId!),
    enabled: !!taskId,
    staleTime: 15 * 1000,
  });
}

export function useCreateSubtask(
  taskId: string,
): UseMutationResult<{ taskId: string }, HttpError, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => createSubtask(taskId, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskDetailKeys.subtasks(taskId) });
      qc.invalidateQueries({ queryKey: taskDetailKeys.detail(taskId) });
    },
  });
}

export function useToggleSubtask(
  taskId: string,
): UseMutationResult<void, HttpError, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subtaskId: string) => toggleSubtask(taskId, subtaskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskDetailKeys.subtasks(taskId) });
      qc.invalidateQueries({ queryKey: taskDetailKeys.activity(taskId) });
    },
  });
}

export function useDeleteSubtask(
  taskId: string,
): UseMutationResult<void, HttpError, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subtaskId: string) => deleteSubtask(taskId, subtaskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskDetailKeys.subtasks(taskId) });
      qc.invalidateQueries({ queryKey: taskDetailKeys.activity(taskId) });
    },
  });
}

// ─── Attachment hooks ──────────────────────────────────────────────────────────

export function useTaskAttachments(
  taskId: string | null,
): UseQueryResult<{ attachments: TaskAttachment[] }> {
  return useQuery({
    queryKey: taskDetailKeys.attachments(taskId ?? ""),
    queryFn: () => listAttachments(taskId!),
    enabled: !!taskId,
    staleTime: 15 * 1000,
  });
}

type UploadAttachmentVars = { file: File };

export function useUploadAttachment(
  taskId: string,
): UseMutationResult<{ attachmentId: string }, HttpError, UploadAttachmentVars> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file }) => {
      const params = await getAttachmentSignedParams(taskId);
      const { publicId, secureUrl } = await uploadToCloudinary(file, params);
      return saveAttachment(taskId, {
        storageKey: publicId,
        storageUrl: secureUrl,
        fileName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskDetailKeys.attachments(taskId) });
      qc.invalidateQueries({ queryKey: taskDetailKeys.activity(taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteAttachment(
  taskId: string,
): UseMutationResult<void, HttpError, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(taskId, attachmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskDetailKeys.attachments(taskId) });
      qc.invalidateQueries({ queryKey: taskDetailKeys.activity(taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
