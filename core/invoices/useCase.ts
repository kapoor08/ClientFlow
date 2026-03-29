"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchInvoices } from "./repository";
import type { InvoiceListItem } from "./entity";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: () => [...invoiceKeys.all, "list"] as const,
};

export function useInvoices(): UseQueryResult<InvoiceListItem[]> {
  return useQuery({
    queryKey: invoiceKeys.list(),
    queryFn: fetchInvoices,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
