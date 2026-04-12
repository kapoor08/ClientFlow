export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  return {
    page: safePage,
    pageSize: safePageSize,
    total,
    pageCount,
    hasNextPage: safePage < pageCount,
    hasPreviousPage: safePage > 1,
  };
}

export function paginationOffset(page: number, pageSize: number): number {
  return (Math.max(1, page) - 1) * Math.min(pageSize, MAX_PAGE_SIZE);
}
