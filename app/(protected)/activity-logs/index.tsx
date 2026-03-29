"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Activity, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/core/activity/useCase";
import type { ActivityFilters } from "@/core/activity/entity";
import { ActivityItem, SkeletonItem } from "./ActivityItem";
import { ActivityFilters as ActivityFiltersBar } from "./ActivityFilters";

// ─── Page ─────────────────────────────────────────────────────────────────────

const ActivityLogsPage = () => {
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const { data, isLoading } = useActivity(filters);

  const entries = data?.entries ?? [];
  const pagination = data?.pagination;

  function handleEntityTypeChange(value: string) {
    setFilters((f) => ({ ...f, entityType: value === "all" ? undefined : value, page: undefined }));
  }

  function handleDateFromChange(date: Date | undefined) {
    setDateFrom(date);
    setFilters((f) => ({ ...f, dateFrom: date ? format(date, "yyyy-MM-dd") : undefined, page: undefined }));
  }

  function handleDateToChange(date: Date | undefined) {
    setDateTo(date);
    setFilters((f) => ({ ...f, dateTo: date ? format(date, "yyyy-MM-dd") : undefined, page: undefined }));
  }

  function clearDateRange() {
    setDateFrom(undefined);
    setDateTo(undefined);
    setFilters((f) => ({ ...f, dateFrom: undefined, dateTo: undefined, page: undefined }));
  }

  function handlePageChange(delta: number) {
    setFilters((f) => ({ ...f, page: (f.page ?? 1) + delta }));
  }

  const currentPage = filters.page ?? 1;
  const hasAnyFilter = !!(filters.dateFrom || filters.dateTo || filters.entityType);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Activity
          </h1>
          <p className="text-sm text-muted-foreground">
            Chronological activity across your organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pagination && (
            <span className="rounded-pill bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              {pagination.total} event{pagination.total !== 1 ? "s" : ""}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams();
              if (filters.entityType) params.set("entityType", filters.entityType);
              if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
              if (filters.dateTo) params.set("dateTo", filters.dateTo);
              window.location.href = `/api/activity-logs/export?${params.toString()}`;
            }}
          >
            <Download size={14} className="mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <ActivityFiltersBar
        filters={filters}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onEntityTypeChange={handleEntityTypeChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onClear={() => {
          clearDateRange();
          setFilters({});
        }}
      />

      {/* Feed */}
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        {isLoading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonItem key={i} isLast={i === 7} />
            ))}
          </div>
        ) : entries.length === 0 ? (
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
      {pagination && pagination.pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {pagination.pageCount}{" "}
            <span className="text-muted-foreground/60">
              ({pagination.total} events)
            </span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage}
              onClick={() => handlePageChange(-1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => handlePageChange(1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogsPage;
