import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const adminWebhookDeliveriesSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  status: parseAsString.withDefault("exhausted"),
});

export type AdminWebhookDeliveriesSearchParams = ReturnType<
  typeof adminWebhookDeliveriesSearchParamsCache.parse
>;
