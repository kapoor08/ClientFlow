import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const adminBillingWebhookEventsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  status: parseAsString.withDefault("failed"),
});

export type AdminBillingWebhookEventsSearchParams = ReturnType<
  typeof adminBillingWebhookEventsSearchParamsCache.parse
>;
