import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { listTasks, createTask, updateTask, deleteTask } from "./repository";
import type {
  TaskFilters,
  TaskListResponse,
  CreateTaskData,
  UpdateTaskData,
} from "./entity";
import type { HttpError } from "@/core/infrastructure";
import { notificationKeys } from "@/core/notifications/useCase";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (filters: TaskFilters) => [...taskKeys.all, "list", filters] as const,
};

export function useTasks(
  filters: TaskFilters = {},
): UseQueryResult<TaskListResponse> {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => listTasks(filters),
    staleTime: 30 * 1000,
  });
}

export function useCreateTask(): UseMutationResult<
  { taskId: string },
  HttpError,
  CreateTaskData
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

export function useUpdateTask(): UseMutationResult<
  { taskId: string },
  HttpError,
  { taskId: string; data: UpdateTaskData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }) => updateTask(taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

export function useDeleteTask(): UseMutationResult<
  void,
  HttpError,
  { taskId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId }) => deleteTask(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
