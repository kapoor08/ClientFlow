import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import type { HttpError } from "@/core/infrastructure";
import {
  listTeamMembers,
  updateMemberRole,
  suspendMember,
  reactivateMember,
  removeMember,
} from "./repository";
import type { TeamListResponse } from "./entity";

export const teamKeys = {
  all: ["team"] as const,
  list: () => [...teamKeys.all, "list"] as const,
};

export function useTeamMembers(
  initialData?: TeamListResponse,
): UseQueryResult<TeamListResponse> {
  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: listTeamMembers,
    staleTime: 60 * 1000,
    initialData,
  });
}

export function useUpdateMemberRole(): UseMutationResult<
  void,
  HttpError,
  { membershipId: string; roleKey: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, roleKey }) => updateMemberRole(membershipId, roleKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.list() }),
  });
}

export function useSuspendMember(): UseMutationResult<
  void,
  HttpError,
  { membershipId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId }) => suspendMember(membershipId),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.list() }),
  });
}

export function useReactivateMember(): UseMutationResult<
  void,
  HttpError,
  { membershipId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId }) => reactivateMember(membershipId),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.list() }),
  });
}

export function useRemoveMember(): UseMutationResult<
  void,
  HttpError,
  { membershipId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId }) => removeMember(membershipId),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.list() }),
  });
}
