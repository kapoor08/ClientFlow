import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const adminUsersSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  sort: parseAsString.withDefault(""),
  order: parseAsString.withDefault("desc"),
  verified: parseAsString.withDefault(""),
  platformAdmin: parseAsString.withDefault(""),
});

export type AdminUsersSearchParams = ReturnType<
  typeof adminUsersSearchParamsCache.parse
>;
