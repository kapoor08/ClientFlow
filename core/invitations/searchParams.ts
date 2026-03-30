import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const invitationsSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  sort: parseAsString.withDefault(""),
  order: parseAsString.withDefault("desc"),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
});

export type InvitationsSearchParams = Awaited<
  ReturnType<typeof invitationsSearchParamsCache.parse>
>;
