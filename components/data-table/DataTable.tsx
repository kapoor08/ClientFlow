"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  LayoutGrid,
  List,
  Search,
  TableIcon,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils/cn";
import type { PaginationMeta } from "@/utils/pagination";
import type { ColumnDef } from "./types";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

// ─── Pagination ──────────────────────────────────────────────────────────────

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

function TablePagination({ pagination }: { pagination: PaginationMeta }) {
  const [, startTransition] = useTransition();

  const [, setParams] = useQueryStates(
    {
      pageSize: parseAsInteger.withDefault(10),
      page: parseAsInteger.withDefault(1),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  function goToPage(page: number) {
    setParams({ page: page <= 1 ? null : page });
  }

  const rangeStart = (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(pagination.page * pagination.pageSize, pagination.total);
  const pages = buildPageNumbers(pagination.page, pagination.pageCount);

  const pageSizeSelect = (
    <Select
      value={String(pagination.pageSize)}
      onValueChange={(val) =>
        setParams({
          pageSize: Number(val) === 10 ? null : Number(val),
          page: null,
        })
      }
    >
      <SelectTrigger size="sm" className="bg-card h-7 cursor-pointer text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" side="top" className="w-fit!">
        {PAGE_SIZE_OPTIONS.map((size) => (
          <SelectItem
            key={size}
            value={String(size)}
            className="aria-selected:bg-primary/80 hover:bg-primary! aria-selected:text-foreground cursor-pointer text-xs"
          >
            {size} / page
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-xs">
        {pagination.total === 0
          ? "No results"
          : pagination.pageCount <= 1
            ? `${pagination.total} ${pagination.total === 1 ? "result" : "results"}`
            : `Showing ${rangeStart}–${rangeEnd} of ${pagination.total} results`}
      </p>

      {pagination.pageCount > 1 ? (
        <Pagination className="mx-0 w-fit">
          <PaginationContent>
            <PaginationItem>{pageSizeSelect}</PaginationItem>

            {/* Previous */}
            <PaginationItem>
              <Button
                variant="ghost"
                size="default"
                className="cursor-pointer pl-1.5!"
                disabled={!pagination.hasPreviousPage}
                onClick={() => goToPage(pagination.page - 1)}
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:block">Previous</span>
              </Button>
            </PaginationItem>

            {/* Page numbers */}
            {pages.map((p, i) =>
              p === "..." ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <Button
                    variant={p === pagination.page ? "outline" : "ghost"}
                    size="icon"
                    className={cn("size-8 cursor-pointer", p === pagination.page && "bg-card")}
                    aria-current={p === pagination.page ? "page" : undefined}
                    onClick={() => goToPage(p as number)}
                  >
                    {p}
                  </Button>
                </PaginationItem>
              ),
            )}

            {/* Next */}
            <PaginationItem>
              <Button
                variant="ghost"
                size="default"
                className="cursor-pointer pr-1.5!"
                disabled={!pagination.hasNextPage}
                onClick={() => goToPage(pagination.page + 1)}
              >
                <span className="hidden sm:block">Next</span>
                <ChevronRight size={16} />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : (
        pageSizeSelect
      )}
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

type ViewMode = "list" | "grid";

const gridColsClass: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

function Toolbar({
  searchPlaceholder,
  searchExtra,
  hasGridView,
  view,
  onViewChange,
}: {
  searchPlaceholder?: string;
  searchExtra?: ReactNode;
  hasGridView: boolean;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}) {
  const [, startTransition] = useTransition();

  const [{ q }, setParams] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      page: parseAsInteger.withDefault(1),
    },
    { shallow: false, throttleMs: 300, startTransition, clearOnDefault: true },
  );

  // Render toolbar only when there's something to show
  if (!searchPlaceholder && !searchExtra && !hasGridView) return null;

  return (
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      {searchPlaceholder ? (
        <div className="relative max-w-xs flex-1">
          <Search
            size={14}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <Input
            value={q}
            onChange={(e) => setParams({ q: e.target.value, page: 1 })}
            placeholder={searchPlaceholder}
            className="bg-card pr-9 pl-9"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setParams({ q: "", page: 1 })}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      ) : (
        /* Push view toggle to the right when there's no search bar */
        <div className="flex-1" />
      )}

      <div className="flex items-center gap-2">
        {searchExtra}
        {hasGridView ? (
          <div className="border-border flex rounded-lg border">
            <button
              type="button"
              onClick={() => onViewChange("list")}
              aria-label="List view"
              className={cn(
                "cursor-pointer rounded-l-lg px-2.5 py-1.5 transition-colors",
                view === "list"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50",
              )}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => onViewChange("grid")}
              aria-label="Grid view"
              className={cn(
                "cursor-pointer rounded-r-lg px-2.5 py-1.5 transition-colors",
                view === "grid"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50",
              )}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── DataTable ───────────────────────────────────────────────────────────────

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  getRowKey: (row: T) => string;
  /** Renders the search bar when provided */
  searchPlaceholder?: string;
  /** Extra filter controls rendered alongside the search bar */
  searchExtra?: ReactNode;
  /** Renders pagination when provided */
  pagination?: PaginationMeta;
  /**
   * Provide a card render function to enable the list/grid view toggle.
   * The returned node is rendered inside a grid item - wrap with a Link if the card should be navigable.
   */
  gridCard?: (row: T) => ReactNode;
  /** Number of grid columns - default 3 */
  gridCols?: 2 | 3 | 4;
  /**
   * Enable infinite scroll in grid view.
   * Requires `loadMore` to be provided.
   */
  infiniteScroll?: boolean;
  /** Called with (page, pageSize) to fetch the next page of items in grid mode. */
  loadMore?: (page: number, pageSize: number) => Promise<T[]>;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
};

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  searchPlaceholder,
  searchExtra,
  pagination,
  gridCard,
  gridCols = 3,
  infiniteScroll = false,
  loadMore,
  emptyTitle = "No results found.",
  emptyDescription = "Try adjusting your search or filters.",
  emptyAction,
}: DataTableProps<T>) {
  const [, startTransition] = useTransition();

  // ── Infinite scroll state (grid view only) ──────────────────────────────────
  const [accumulatedItems, setAccumulatedItems] = useState<T[]>(data);
  const [nextPage, setNextPage] = useState(2);
  const [hasMore, setHasMore] = useState(pagination?.hasNextPage ?? false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef(0); // incremented on each data reset to cancel stale fetches

  // Reset accumulated items when server data changes (filter/search/initial)
  useEffect(() => {
    generationRef.current += 1;
    setAccumulatedItems(data);
    setNextPage(2);
    setHasMore(pagination?.hasNextPage ?? false);
    setIsLoadingMore(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // IntersectionObserver sentinel
  useEffect(() => {
    if (!infiniteScroll || !loadMore || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || isLoadingMore) return;
        const gen = generationRef.current;
        setIsLoadingMore(true);
        try {
          const pageSize = pagination?.pageSize ?? 12;
          const newItems = await loadMore(nextPage, pageSize);
          if (generationRef.current !== gen) return; // stale - data was reset
          setAccumulatedItems((prev) => [...prev, ...newItems]);
          setNextPage((p) => p + 1);
          setHasMore(newItems.length >= pageSize);
        } finally {
          if (generationRef.current === gen) setIsLoadingMore(false);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [infiniteScroll, loadMore, hasMore, isLoadingMore, nextPage, pagination?.pageSize]);

  // Sort state - also resets page when changed
  const [{ sort, order }, setSort] = useQueryStates(
    {
      sort: parseAsString.withDefault(""),
      order: parseAsString.withDefault("asc"),
      page: parseAsInteger.withDefault(1),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  // View mode - persisted in URL, only active when gridCard is provided
  const [{ view: rawView }, setViewParams] = useQueryStates(
    {
      view: parseAsString.withDefault("list"),
      pageSize: parseAsInteger.withDefault(10),
      page: parseAsInteger.withDefault(1),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );
  const view: ViewMode = gridCard && rawView === "grid" ? "grid" : "list";

  function handleViewChange(v: ViewMode) {
    setViewParams({
      view: v === "list" ? null : v,
      pageSize: v === "grid" ? 12 : null, // null resets to default (10)
      page: null,
    });
  }

  function handleSort(key: string) {
    if (sort === key) {
      setSort(
        order === "asc"
          ? { sort: key, order: "desc", page: null }
          : { sort: null, order: null, page: null },
      );
    } else {
      setSort({ sort: key, order: "asc", page: null });
    }
  }

  const hasToolbar = !!searchPlaceholder || !!searchExtra || !!gridCard;

  return (
    <div>
      {hasToolbar ? (
        <Toolbar
          searchPlaceholder={searchPlaceholder}
          searchExtra={searchExtra}
          hasGridView={!!gridCard}
          view={view}
          onViewChange={handleViewChange}
        />
      ) : null}

      {data.length === 0 ? (
        <Empty className="rounded-card border-border bg-card shadow-cf-1 border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TableIcon />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
          {emptyAction ? <EmptyContent>{emptyAction}</EmptyContent> : null}
        </Empty>
      ) : view === "grid" && gridCard ? (
        <>
          <div className={cn("grid gap-4", gridColsClass[gridCols] ?? gridColsClass[3])}>
            {(infiniteScroll ? accumulatedItems : data).map((row) => (
              <div key={getRowKey(row)}>{gridCard(row)}</div>
            ))}
          </div>

          {infiniteScroll && loadMore && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <div ref={sentinelRef} className="h-1 w-full" />
              {isLoadingMore && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 size={15} className="animate-spin" />
                  Loading more…
                </div>
              )}
              {!hasMore && !isLoadingMore && accumulatedItems.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  All {accumulatedItems.length} items loaded
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-card border-border bg-card shadow-cf-1 overflow-hidden border">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-secondary/50 hover:bg-secondary/50 border-b">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "text-muted-foreground px-4 py-3 font-medium",
                      col.hideOnMobile && "hidden sm:table-cell",
                      col.hideOnTablet && "hidden md:table-cell",
                      col.headerClassName,
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        {col.header}
                        {sort === col.key ? (
                          order === "asc" ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )
                        ) : (
                          <ChevronsUpDown size={12} className="opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  className="border-border hover:bg-secondary/30 border-b last:border-0"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "px-4 py-3",
                        col.hideOnMobile && "hidden sm:table-cell",
                        col.hideOnTablet && "hidden md:table-cell",
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination && !(infiniteScroll && view === "grid") ? (
        <div className="mt-3">
          <TablePagination pagination={pagination} />
        </div>
      ) : null}
    </div>
  );
}
