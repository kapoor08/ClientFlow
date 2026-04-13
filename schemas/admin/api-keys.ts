import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const adminApiKeysSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  status: parseAsString.withDefault(""),
});

export type AdminApiKeysSearchParams = ReturnType<
  typeof adminApiKeysSearchParamsCache.parse
>;
