import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const adminWebhooksSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  status: parseAsString.withDefault(""),
});

export type AdminWebhooksSearchParams = ReturnType<
  typeof adminWebhooksSearchParamsCache.parse
>;
