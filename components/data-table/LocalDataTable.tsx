"use client";

import { useMemo, type ReactNode } from "react";
import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs";
import { DataTable } from "./DataTable";
import { FiltersPopover, type FilterOption } from "./FiltersPopover";
import type { ColumnDef } from "./types";
import { buildPaginationMeta } from "@/utils/pagination";

/**
 * Configuration for a single client-side filter dropdown.
 *
 * Unlike the server-side `FilterGroupConfig` exposed by `FiltersPopover`, this
 * variant lets the caller declare a `match(row, value)` predicate so the
 * filtering happens entirely in memory. The component owns the URL state for
 * the filter value (one query param per filter `key`).
 */
export type LocalFilterConfig<T> = {
  /** URL param key. Must be unique within the page. */
  key: string;
  label: string;
  options: FilterOption[];
  /** Returns true when the row should be kept for the given filter value. */
  match: (row: T, value: string) => boolean;
};

type LocalDataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  getRowKey: (row: T) => string;
  /** Renders the search bar. Caller supplies how a row matches a query. */
  searchPlaceholder?: string;
  /**
   * Returns the searchable text for a row. Called once per row per render -
   * keep it cheap. Case-insensitive substring matching is applied to the
   * returned string. Required when `searchPlaceholder` is set.
   */
  searchAccessor?: (row: T) => string;
  /** Filter dropdowns shown in a single FiltersPopover button. */
  filters?: LocalFilterConfig<T>[];
  /** Field accessors keyed by column key, used to sort rows when a column is sortable. */
  sortAccessors?: Record<string, (row: T) => string | number | Date | null | undefined>;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
};

/**
 * Wraps `DataTable` for fully-hydrated arrays where the server returns the
 * complete dataset in one shot (typical for admin detail pages). Reads the
 * same URL state keys as `DataTable` (`q`, `page`, `pageSize`, `sort`,
 * `order`) so the existing toolbar/pagination controls work without any
 * additional plumbing.
 *
 * Constraint: only mount one of these per page - the URL keys are shared
 * with `DataTable`. For pages that need multiple tables, gate them behind
 * tabs so just one is mounted at a time.
 */
export function LocalDataTable<T>({
  data,
  columns,
  getRowKey,
  searchPlaceholder,
  searchAccessor,
  filters,
  sortAccessors,
  pageSize: defaultPageSize = 10,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: LocalDataTableProps<T>) {
  const [{ q, page, pageSize, sort, order }] = useQueryStates({
    q: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(defaultPageSize),
    sort: parseAsString.withDefault(""),
    order: parseAsString.withDefault("asc"),
  });

  const filterValues = useFilterValues(filters);

  const { pagedData, pagination } = useMemo(() => {
    let rows = data;

    // Search
    const trimmed = q.trim().toLowerCase();
    if (trimmed && searchAccessor) {
      rows = rows.filter((row) => searchAccessor(row).toLowerCase().includes(trimmed));
    }

    // Filters
    if (filters && filters.length > 0) {
      for (const f of filters) {
        const value = filterValues[f.key];
        if (value) rows = rows.filter((row) => f.match(row, value));
      }
    }

    // Sort
    if (sort && sortAccessors?.[sort]) {
      const get = sortAccessors[sort];
      const dir = order === "desc" ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const av = get(a);
        const bv = get(b);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (av instanceof Date && bv instanceof Date) {
          return (av.getTime() - bv.getTime()) * dir;
        }
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    }

    const meta = buildPaginationMeta(rows.length, page, pageSize);
    const start = (meta.page - 1) * meta.pageSize;
    return { pagedData: rows.slice(start, start + meta.pageSize), pagination: meta };
  }, [data, q, sort, order, page, pageSize, filters, filterValues, searchAccessor, sortAccessors]);

  const searchExtra =
    filters && filters.length > 0 ? (
      <FiltersPopover
        filters={filters.map((f) => ({
          key: f.key,
          label: f.label,
          options: f.options,
          value: filterValues[f.key] ?? "",
          onChange: filterValues.setters[f.key],
        }))}
      />
    ) : undefined;

  return (
    <DataTable
      data={pagedData}
      columns={columns}
      getRowKey={getRowKey}
      searchPlaceholder={searchPlaceholder}
      searchExtra={searchExtra}
      pagination={pagination}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
    />
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Reads each filter's URL param into a flat map plus exposes per-key setters.
 * Filter-state hooks must be called unconditionally in the same order on every
 * render, so we cap the supported count and call all hooks - the unused slots
 * just track an empty key that nothing else references.
 */
const MAX_FILTERS = 6;

function useFilterValues<T>(
  filters: LocalFilterConfig<T>[] | undefined,
): Record<string, string> & { setters: Record<string, (value: string) => void> } {
  const list = filters ?? [];
  if (list.length > MAX_FILTERS) {
    throw new Error(`LocalDataTable supports at most ${MAX_FILTERS} filters`);
  }

  // Slot 0..MAX_FILTERS-1: each calls its own hook (must be unconditional).
  const slots = Array.from({ length: MAX_FILTERS }, (_, i) => {
    const cfg = list[i];
    const key = cfg ? cfg.key : `__lt_unused_${i}`;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryState(
      key,
      parseAsString.withDefault("").withOptions({ shallow: false, clearOnDefault: true }),
    );
  });

  const values: Record<string, string> = {};
  const setters: Record<string, (value: string) => void> = {};
  list.forEach((f, i) => {
    const [v, setV] = slots[i];
    values[f.key] = v;
    setters[f.key] = (value: string) => setV(value || null);
  });

  return Object.assign(values, { setters });
}
