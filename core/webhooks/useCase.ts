import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  listWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
} from "./repository";
import type {
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookItem,
  WebhookListResponse,
} from "./entity";
import type { HttpError } from "@/core/infrastructure";

export const webhookKeys = {
  all: ["webhooks"] as const,
  list: () => [...webhookKeys.all, "list"] as const,
};

export function useWebhooks(): UseQueryResult<WebhookListResponse, HttpError> {
  return useQuery({
    queryKey: webhookKeys.list(),
    queryFn: listWebhooks,
  });
}

export function useCreateWebhook(): UseMutationResult<
  { webhook: WebhookItem },
  HttpError,
  CreateWebhookInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: webhookKeys.all });
    },
  });
}

export function useUpdateWebhook(): UseMutationResult<
  void,
  HttpError,
  { id: string; data: UpdateWebhookInput }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateWebhook(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: webhookKeys.all });
    },
  });
}

export function useDeleteWebhook(): UseMutationResult<void, HttpError, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: webhookKeys.all });
    },
  });
}
