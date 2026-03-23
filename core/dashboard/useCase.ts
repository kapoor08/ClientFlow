import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchDashboardContext } from "./repository";
import type { DashboardContext } from "./entity";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  context: () => [...dashboardKeys.all, "context"] as const,
};

export function useDashboard(): UseQueryResult<DashboardContext> {
  return useQuery({
    queryKey: dashboardKeys.context(),
    queryFn: fetchDashboardContext,
    staleTime: 30 * 1000,
  });
}
