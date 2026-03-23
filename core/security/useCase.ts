import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type { HttpError } from "@/core/infrastructure";
import { listSessions, revokeSession, revokeAllSessions } from "./repository";
import type { SessionsResponse } from "./entity";

export const securityKeys = {
  all: ["security"] as const,
  sessions: () => [...securityKeys.all, "sessions"] as const,
};

export function useSessions(): UseQueryResult<SessionsResponse> {
  return useQuery({
    queryKey: securityKeys.sessions(),
    queryFn: listSessions,
    staleTime: 30 * 1000,
  });
}

export function useRevokeSession(): UseMutationResult<
  void,
  HttpError,
  { sessionId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId }) => revokeSession(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: securityKeys.sessions() }),
  });
}

export function useRevokeAllSessions(): UseMutationResult<
  { revoked: number },
  HttpError,
  void
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => qc.invalidateQueries({ queryKey: securityKeys.sessions() }),
  });
}
