import { http } from "@/core/infrastructure";
import type { AnalyticsResponse } from "./entity";

export type GetAnalyticsParams = {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
};

export async function getAnalytics(
  params: GetAnalyticsParams = {},
): Promise<AnalyticsResponse> {
  const query = new URLSearchParams();
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.clientId) query.set("clientId", params.clientId);
  const qs = query.toString();
  return http<AnalyticsResponse>(`/api/analytics${qs ? `?${qs}` : ""}`);
}
