import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const auditSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
});

export type AuditSearchParams = Awaited<
  ReturnType<typeof auditSearchParamsCache.parse>
>;
