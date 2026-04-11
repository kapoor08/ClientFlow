import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  listProjectTemplates,
  createProjectTemplate,
  updateProjectTemplate,
  deleteProjectTemplate,
} from "./repository";
import type {
  ProjectTemplate,
  ProjectTemplateInput,
  ProjectTemplateListResponse,
} from "./entity";
import type { HttpError } from "@/core/infrastructure";

export const projectTemplateKeys = {
  all: ["project-templates"] as const,
  list: () => [...projectTemplateKeys.all, "list"] as const,
};

export function useProjectTemplates(): UseQueryResult<ProjectTemplateListResponse, HttpError> {
  return useQuery({
    queryKey: projectTemplateKeys.list(),
    queryFn: listProjectTemplates,
  });
}

export function useCreateProjectTemplate(): UseMutationResult<
  { template: ProjectTemplate },
  HttpError,
  ProjectTemplateInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProjectTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectTemplateKeys.all });
    },
  });
}

export function useUpdateProjectTemplate(): UseMutationResult<
  void,
  HttpError,
  { id: string; data: ProjectTemplateInput }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateProjectTemplate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectTemplateKeys.all });
    },
  });
}

export function useDeleteProjectTemplate(): UseMutationResult<
  void,
  HttpError,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProjectTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectTemplateKeys.all });
    },
  });
}
