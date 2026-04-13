import { z } from "zod";
import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const adminOrgsSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  sort: parseAsString.withDefault(""),
  order: parseAsString.withDefault("desc"),
  status: parseAsString.withDefault(""),
  plan: parseAsString.withDefault(""),
});

export type AdminOrgsSearchParams = ReturnType<
  typeof adminOrgsSearchParamsCache.parse
>;

// ── Mutation schemas ──────────────────────────────────────────────────────────

export const suspendOrgSchema = z.object({
  orgId: z.string().min(1),
  reason: z.string().min(3, "Reason must be at least 3 characters.").max(500),
});
export type SuspendOrgValues = z.infer<typeof suspendOrgSchema>;

export const deleteOrgSchema = z.object({
  orgId: z.string().min(1),
  orgName: z.string().min(1),
  confirmName: z.string().min(1, "Type the organization name to confirm."),
}).refine((d) => d.confirmName === d.orgName, {
  message: "Name does not match.",
  path: ["confirmName"],
});
export type DeleteOrgValues = z.infer<typeof deleteOrgSchema>;

export const forceLogoutOrgSchema = z.object({
  orgId: z.string().min(1),
});
export type ForceLogoutOrgValues = z.infer<typeof forceLogoutOrgSchema>;
