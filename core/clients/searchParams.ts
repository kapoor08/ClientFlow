import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const clientsSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  sort: parseAsString.withDefault(""),
  order: parseAsString.withDefault("asc"),
  status: parseAsString.withDefault(""),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
});

export type ClientsSearchParams = ReturnType<
  typeof clientsSearchParamsCache.parse
>;
