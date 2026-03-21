import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { HttpError } from "@/core/infrastructure";
import {
  listFiles,
  listAllFiles,
  saveFile,
  deleteFile,
  getSignedUploadParams,
  uploadToCloudinary,
} from "./repository";
import type {
  OrgFileListItem,
  ProjectFile,
  SaveFileInput,
  FileMutationResponse,
} from "./entity";

export const fileKeys = {
  all: ["files"] as const,
  lists: () => [...fileKeys.all, "list"] as const,
  list: (params: object) => [...fileKeys.lists(), params] as const,
  byProject: (projectId: string) => [...fileKeys.all, "project", projectId] as const,
};

export function useProjectFiles(
  projectId: string,
): UseQueryResult<ProjectFile[], HttpError> {
  return useQuery({
    queryKey: fileKeys.byProject(projectId),
    queryFn: async () => {
      const res = await listFiles(projectId);
      return res.files;
    },
    enabled: !!projectId,
  });
}

export type UploadFileInput = {
  projectId: string;
  file: File;
};

export function useUploadFile(projectId: string): UseMutationResult<
  FileMutationResponse,
  Error,
  UploadFileInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId: pid, file }) => {
      const params = await getSignedUploadParams(pid);
      const { publicId, secureUrl } = await uploadToCloudinary(file, params);
      return saveFile({
        projectId: pid,
        storageKey: publicId,
        storageUrl: secureUrl,
        fileName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
      } satisfies SaveFileInput);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fileKeys.byProject(projectId) });
    },
  });
}

export function useDeleteFile(projectId?: string): UseMutationResult<
  void,
  HttpError,
  { fileId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId }) => deleteFile(fileId),
    onSuccess: () => {
      // Invalidate both the project-scoped and org-wide lists
      qc.invalidateQueries({ queryKey: fileKeys.lists() });
      if (projectId) {
        qc.invalidateQueries({ queryKey: fileKeys.byProject(projectId) });
      }
    },
  });
}

export function useAllFiles(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}): UseQueryResult<OrgFileListItem[], HttpError> {
  return useQuery({
    queryKey: fileKeys.list(params),
    queryFn: async () => {
      const res = await listAllFiles(params);
      return res.files;
    },
  });
}
