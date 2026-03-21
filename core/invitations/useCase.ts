import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { HttpError } from "@/core/infrastructure";
import {
  listInvitations,
  getAssignableRoles,
  sendInvitation,
  revokeInvitation,
  resendInvitation,
} from "./repository";
import type {
  InvitationListResponse,
  AssignableRolesResponse,
  SendInviteData,
  InviteMutationResponse,
  InviteActionResponse,
} from "./entity";

export const invitationKeys = {
  all: ["invitations"] as const,
  lists: () => [...invitationKeys.all, "list"] as const,
  list: (params: object) => [...invitationKeys.lists(), params] as const,
  roles: () => [...invitationKeys.all, "roles"] as const,
};

export function useInvitations(params: {
  page?: number;
  pageSize?: number;
} = {}): UseQueryResult<InvitationListResponse, HttpError> {
  return useQuery({
    queryKey: invitationKeys.list(params),
    queryFn: () => listInvitations(params),
  });
}

export function useAssignableRoles(): UseQueryResult<AssignableRolesResponse, HttpError> {
  return useQuery({
    queryKey: invitationKeys.roles(),
    queryFn: getAssignableRoles,
  });
}

export function useSendInvitation(): UseMutationResult<
  InviteMutationResponse,
  HttpError,
  SendInviteData
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendInvitation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
  });
}

export function useRevokeInvitation(): UseMutationResult<
  InviteActionResponse,
  HttpError,
  { invitationId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invitationId }) => revokeInvitation(invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
  });
}

export function useResendInvitation(): UseMutationResult<
  InviteActionResponse,
  HttpError,
  { invitationId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invitationId }) => resendInvitation(invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
  });
}
