import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const billingSearchParamsCache = createSearchParamsCache({
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
});

export type BillingSearchParams = Awaited<
  ReturnType<typeof billingSearchParamsCache.parse>
>;
