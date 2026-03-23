import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { getAnalytics } from "./repository";
import type { AnalyticsFilters, AnalyticsResponse, DatePreset } from "./entity";
import { resolveDateRange } from "./entity";

export const analyticsKeys = {
  all: ["analytics"] as const,
  summary: (filters: AnalyticsFilters) =>
    [...analyticsKeys.all, "summary", filters] as const,
};

export function useAnalytics(
  filters: AnalyticsFilters,
): UseQueryResult<AnalyticsResponse> {
  const { dateFrom, dateTo } = resolveDateRange(filters.datePreset);
  return useQuery({
    queryKey: analyticsKeys.summary(filters),
    queryFn: () =>
      getAnalytics({
        dateFrom,
        dateTo,
        clientId: filters.clientId || undefined,
      }),
    staleTime: 2 * 60 * 1000,
  });
}

export const DEFAULT_FILTERS: AnalyticsFilters = {
  datePreset: "6m" as DatePreset,
  clientId: "",
};
