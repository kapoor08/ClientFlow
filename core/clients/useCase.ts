"use client";

import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { HttpError } from "@/core/infrastructure";
import { notificationKeys } from "@/core/notifications/useCase";
import type {
  ClientMutationResponse,
  CreateClientData,
  UpdateClientData,
} from "./entity";
import { createClient, deleteClient, updateClient } from "./repository";

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateClient(): UseMutationResult<
  ClientMutationResponse,
  HttpError,
  CreateClientData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...clientKeys.all, "create"],
    mutationFn: (data) => createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

export function useUpdateClient(): UseMutationResult<
  ClientMutationResponse,
  HttpError,
  { clientId: string; data: UpdateClientData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...clientKeys.all, "update"],
    mutationFn: ({ clientId, data }) => updateClient(clientId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.clientId),
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

export function useDeleteClient(): UseMutationResult<
  void,
  HttpError,
  { clientId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...clientKeys.all, "delete"],
    mutationFn: ({ clientId }) => deleteClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}
