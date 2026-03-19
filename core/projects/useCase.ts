import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { HttpError } from "@/core/infrastructure";
import {
  createProject,
  updateProject,
  deleteProject,
} from "./repository";
import type {
  ProjectMutationResponse,
  CreateProjectData,
  UpdateProjectData,
} from "./entity";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params: object) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

export function useCreateProject(): UseMutationResult<
  ProjectMutationResponse,
  HttpError,
  CreateProjectData
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useUpdateProject(): UseMutationResult<
  ProjectMutationResponse,
  HttpError,
  { projectId: string; data: UpdateProjectData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }) => updateProject(projectId, data),
    onSuccess: (_res, { projectId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

export function useDeleteProject(): UseMutationResult<
  void,
  HttpError,
  { projectId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId }) => deleteProject(projectId),
    onSuccess: (_res, { projectId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
