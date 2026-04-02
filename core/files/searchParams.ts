import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const filesSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  sort: parseAsString.withDefault(""),
  order: parseAsString.withDefault("asc"),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
  projectId: parseAsString.withDefault(""),
});

export type FilesSearchParams = Awaited<
  ReturnType<typeof filesSearchParamsCache.parse>
>;
