import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const PERIOD_OPTIONS = [
  { value: "7", label: "7d" },
  { value: "30", label: "30d" },
  { value: "90", label: "90d" },
];

export const adminAnalyticsSearchParamsCache = createSearchParamsCache({
  period: parseAsString.withDefault("30"),
});

export type AdminAnalyticsSearchParams = ReturnType<
  typeof adminAnalyticsSearchParamsCache.parse
>;
