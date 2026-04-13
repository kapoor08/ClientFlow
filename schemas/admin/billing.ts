import { z } from "zod";
import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const adminBillingSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  status: parseAsString.withDefault(""),
  plan: parseAsString.withDefault(""),
  cycle: parseAsString.withDefault(""),
});

export type AdminBillingSearchParams = ReturnType<
  typeof adminBillingSearchParamsCache.parse
>;

// ── Mutation schemas ──────────────────────────────────────────────────────────

export const extendTrialSchema = z.object({
  subscriptionId: z.string().min(1),
  days: z.coerce.number().int().min(1, "Must extend by at least 1 day.").max(365),
  reason: z.string().min(3, "Reason is required.").max(500),
});
export type ExtendTrialValues = z.infer<typeof extendTrialSchema>;

export const changePlanSchema = z.object({
  subscriptionId: z.string().min(1),
  newPlanId: z.string().min(1, "Select a plan."),
  reason: z.string().min(3, "Reason is required.").max(500),
});
export type ChangePlanValues = z.infer<typeof changePlanSchema>;
