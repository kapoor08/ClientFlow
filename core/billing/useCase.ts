import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchBillingContext } from "./repository";
import type { BillingContext } from "./entity";

export const billingKeys = {
  all: ["billing"] as const,
  context: () => [...billingKeys.all, "context"] as const,
};

export function useBilling(): UseQueryResult<BillingContext> {
  return useQuery({
    queryKey: billingKeys.context(),
    queryFn: fetchBillingContext,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
