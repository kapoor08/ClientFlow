import {
  createSearchParamsCache,
  parseAsString,
} from "nuqs/server";

export const analyticsSearchParamsCache = createSearchParamsCache({
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
  clientId: parseAsString.withDefault(""),
});

export type AnalyticsSearchParams = Awaited<
  ReturnType<typeof analyticsSearchParamsCache.parse>
>;
