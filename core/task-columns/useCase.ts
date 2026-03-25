import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  listColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from "./repository";
import type {
  BoardColumnsResponse,
  CreateColumnData,
  UpdateColumnData,
} from "./entity";
import type { HttpError } from "@/core/infrastructure";
import { taskKeys } from "@/core/tasks/useCase";

export const columnKeys = {
  all: ["task-columns"] as const,
  list: () => [...columnKeys.all, "list"] as const,
};

export function useBoardColumns(
  initialData?: BoardColumnsResponse,
): UseQueryResult<BoardColumnsResponse> {
  return useQuery({
    queryKey: columnKeys.list(),
    queryFn: listColumns,
    staleTime: 60 * 1000,
    initialData,
  });
}

export function useCreateColumn(): UseMutationResult<
  { columnId: string },
  HttpError,
  CreateColumnData
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createColumn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: columnKeys.all });
    },
  });
}

export function useUpdateColumn(): UseMutationResult<
  void,
  HttpError,
  { columnId: string; data: UpdateColumnData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, data }) => updateColumn(columnId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: columnKeys.all });
    },
  });
}

export function useDeleteColumn(): UseMutationResult<
  void,
  HttpError,
  { columnId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId }) => deleteColumn(columnId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: columnKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useReorderColumns(): UseMutationResult<
  void,
  HttpError,
  { orderedIds: string[] }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderedIds }) => reorderColumns(orderedIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: columnKeys.all });
    },
  });
}
