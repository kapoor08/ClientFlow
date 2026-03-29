"use client";

import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/form";
import { ENTITY_TYPE_OPTIONS } from "@/core/activity/entity";
import type { ActivityFilters as ActivityFiltersType } from "@/core/activity/entity";

// ─── ActivityFilters ──────────────────────────────────────────────────────────

type ActivityFiltersProps = {
  filters: ActivityFiltersType;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onEntityTypeChange: (value: string) => void;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onClear: () => void;
};

export function ActivityFilters({
  filters,
  dateFrom,
  dateTo,
  onEntityTypeChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: ActivityFiltersProps) {
  const hasDateFilter = !!(filters.dateFrom || filters.dateTo);
  const hasAnyFilter = hasDateFilter || !!filters.entityType;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-card border border-border bg-card p-3 shadow-cf-1">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Filter size={13} />
        <span>Filter</span>
      </div>
      <div className="h-4 w-px bg-border" />

      <Select
        value={filters.entityType ?? "all"}
        onValueChange={onEntityTypeChange}
      >
        <SelectTrigger className="h-8 w-40 cursor-pointer bg-background text-xs">
          <SelectValue placeholder="All activity" />
        </SelectTrigger>
        <SelectContent position="popper">
          {ENTITY_TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <div className="w-36">
          <DatePicker
            value={dateFrom}
            onChange={onDateFromChange}
            placeholder="From date"
          />
        </div>
        <span className="text-xs text-muted-foreground">—</span>
        <div className="w-36">
          <DatePicker
            value={dateTo}
            onChange={onDateToChange}
            placeholder="To date"
          />
        </div>
      </div>

      {hasAnyFilter && (
        <>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 gap-1.5 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X size={12} />
            Clear
          </Button>
        </>
      )}
    </div>
  );
}
