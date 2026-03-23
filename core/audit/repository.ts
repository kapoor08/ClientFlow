import { http } from "@/core/infrastructure";
import type { AuditLogsResponse } from "./entity";

export type ListAuditLogsParams = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listAuditLogs(
  params: ListAuditLogsParams = {},
): Promise<AuditLogsResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const qs = query.toString();
  return http<AuditLogsResponse>(`/api/audit-logs${qs ? `?${qs}` : ""}`);
}
