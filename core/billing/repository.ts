import { http } from "@/core/infrastructure";
import type { BillingContext } from "./entity";

export async function fetchBillingContext(): Promise<BillingContext> {
  return http<BillingContext>("/api/billing");
}
