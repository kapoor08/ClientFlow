import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const adminAuditLogsSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  entityType: parseAsString.withDefault(""),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
});

export type AdminAuditLogsSearchParams = ReturnType<
  typeof adminAuditLogsSearchParamsCache.parse
>;
