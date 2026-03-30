import {
  createSearchParamsCache,
  parseAsString,
} from "nuqs/server";

export const analyticsSearchParamsCache = createSearchParamsCache({
  datePreset: parseAsString.withDefault("6m"),
  clientId: parseAsString.withDefault(""),
});

export type AnalyticsSearchParams = Awaited<
  ReturnType<typeof analyticsSearchParamsCache.parse>
>;
