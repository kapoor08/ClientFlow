import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { listAuditLogs } from "./repository";
import type { AuditLogsResponse } from "./entity";

export const auditKeys = {
  all: ["audit-logs"] as const,
  list: (params: object) => [...auditKeys.all, "list", params] as const,
};

export function useAuditLogs(params: {
  q?: string;
  page?: number;
}): UseQueryResult<AuditLogsResponse> {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => listAuditLogs(params),
    staleTime: 30 * 1000,
  });
}
