import { http } from "@/core/infrastructure";
import type { ActivityFilters, ActivityResponse } from "./entity";

export async function fetchActivity(
  filters: ActivityFilters = {},
): Promise<ActivityResponse> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const qs = params.toString();
  return http<ActivityResponse>(`/api/activity-logs${qs ? `?${qs}` : ""}`);
}
