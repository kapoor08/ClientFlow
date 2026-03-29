import { http } from "@/core/infrastructure";
import type { InvoiceListItem } from "./entity";

export async function fetchInvoices(): Promise<InvoiceListItem[]> {
  return http<InvoiceListItem[]>("/api/invoices");
}
