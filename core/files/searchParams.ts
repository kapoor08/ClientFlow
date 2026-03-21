import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const filesSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
});

export type FilesSearchParams = Awaited<
  ReturnType<typeof filesSearchParamsCache.parse>
>;
