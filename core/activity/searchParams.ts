import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const activitySearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  entityType: parseAsString.withDefault(""),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
});

export type ActivitySearchParams = Awaited<
  ReturnType<typeof activitySearchParamsCache.parse>
>;
