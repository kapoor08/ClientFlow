import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const clientsSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  sort: parseAsString.withDefault(""),
  order: parseAsString.withDefault("asc"),
});

export type ClientsSearchParams = ReturnType<
  typeof clientsSearchParamsCache.parse
>;
