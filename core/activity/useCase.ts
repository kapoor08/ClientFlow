import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchActivity } from "./repository";
import type { ActivityFilters, ActivityResponse } from "./entity";

export const activityKeys = {
  all: ["activity"] as const,
  list: (filters: ActivityFilters) => [...activityKeys.all, filters] as const,
};

export function useActivity(
  filters: ActivityFilters = {},
): UseQueryResult<ActivityResponse> {
  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn: () => fetchActivity(filters),
    staleTime: 30 * 1000,
  });
}
