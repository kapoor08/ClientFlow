import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const projectsSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  sort: parseAsString.withDefault(""),
  order: parseAsString.withDefault("asc"),
  status: parseAsString.withDefault(""),
  priority: parseAsString.withDefault(""),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
});

export type ProjectsSearchParams = Awaited<
  ReturnType<typeof projectsSearchParamsCache.parse>
>;
