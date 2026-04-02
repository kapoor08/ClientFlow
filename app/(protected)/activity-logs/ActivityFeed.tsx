"use client";

import { useTransition } from "react";
import { Activity, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import {
  DateRangeFilter,
  FiltersPopover,
  type FilterGroupConfig,
} from "@/components/data-table";
import { ENTITY_TYPE_OPTIONS } from "@/core/activity/entity";
import type { ActivityEntry } from "@/core/activity/entity";
import type { PaginationMeta } from "@/lib/pagination";
import { ActivityItem } from "./ActivityItem";

// ─── Entity type filter options (exclude the "all" sentinel) ─────────────────

const ENTITY_FILTER_OPTIONS = ENTITY_TYPE_OPTIONS.filter(
  (o) => o.value !== "all",
).map((o) => ({ label: o.label, value: o.value }));

// ─── ActivityFeed ─────────────────────────────────────────────────────────────

type ActivityFeedProps = {
  entries: ActivityEntry[];
  pagination: PaginationMeta;
};

export function ActivityFeed({ entries, pagination }: ActivityFeedProps) {
  const [, startTransition] = useTransition();

  const [entityType, setEntityType] = useQueryState(
    "entityType",
    parseAsString
      .withDefault("")
      .withOptions({ shallow: false, startTransition, clearOnDefault: true }),
  );

  const [, setPage] = useQueryState(
    "page",
    parseAsInteger
      .withDefault(1)
      .withOptions({ shallow: false, startTransition, clearOnDefault: true }),
  );

  const hasAnyFilter = !!entityType;

  const filters: FilterGroupConfig[] = [
    {
      key: "entityType",
      label: "Entity type",
      options: ENTITY_FILTER_OPTIONS,
      value: entityType,
      onChange: (value) => {
        setEntityType(value || null);
        setPage(null);
      },
    },
  ];

  function handleExport() {
    const params = new URLSearchParams();
    if (entityType) params.set("entityType", entityType);
    window.location.href = `/api/activity-logs/export?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeFilter />
        <FiltersPopover filters={filters} />
        <div className="ml-auto">
          <Button variant="default" className="cursor-pointer" size="lg" onClick={handleExport}>
            <Download size={14} className="mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Feed */}
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Activity size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                No activity found
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {hasAnyFilter
                  ? "Try adjusting your filters to see more events."
                  : "Activity will appear here as your team works."}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {entries.map((entry, i) => (
              <ActivityItem
                key={entry.id}
                entry={entry}
                isLast={i === entries.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.pageCount}{" "}
            <span className="text-muted-foreground/60">
              ({pagination.total} event{pagination.total !== 1 ? "s" : ""})
            </span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage(pagination.page - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage(pagination.page + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
