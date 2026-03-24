"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  FolderKanban,
  Mail,
  Shield,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/form";
import { useActivity } from "@/core/activity/useCase";
import type { ActivityFilters, ActivityEntry } from "@/core/activity/entity";
import {
  ENTITY_TYPE_OPTIONS,
  getActionLabel,
  getEntityName,
  getEntityBadgeStyle,
} from "@/core/activity/entity";

// ─── Entity meta ──────────────────────────────────────────────────────────────

const ENTITY_ICON: Record<string, React.ElementType> = {
  client: Users,
  project: FolderKanban,
  file: FileText,
  invitation: Mail,
  membership: Shield,
  task: CheckSquare,
};

const ENTITY_ICON_BG: Record<string, string> = {
  client: "bg-blue-100 text-blue-600",
  project: "bg-violet-100 text-violet-600",
  file: "bg-amber-100 text-amber-600",
  invitation: "bg-emerald-100 text-emerald-600",
  membership: "bg-rose-100 text-rose-600",
  task: "bg-indigo-100 text-indigo-600",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActorAvatar({ name }: { name: string | null }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-primary ring-2 ring-background">
      {getInitials(name)}
    </div>
  );
}

function EntityBadge({ entityType }: { entityType: string }) {
  return (
    <span
      className={`rounded-pill px-2 py-0.5 text-[10px] font-semibold capitalize tracking-wide ${getEntityBadgeStyle(entityType)}`}
    >
      {entityType}
    </span>
  );
}

function EntityIconCircle({ entityType }: { entityType: string }) {
  const Icon = ENTITY_ICON[entityType] ?? Activity;
  const bg = ENTITY_ICON_BG[entityType] ?? "bg-secondary text-muted-foreground";
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`}
    >
      <Icon size={15} strokeWidth={2} />
    </div>
  );
}

// ─── Activity row ─────────────────────────────────────────────────────────────

function ActivityRow({ entry, isLast }: { entry: ActivityEntry; isLast: boolean }) {
  const actionLabel = getActionLabel(entry.action);
  const entityName = getEntityName(entry);
  const actorDisplay = entry.actorName ?? "System";

  return (
    <div className="relative flex gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors">
      {/* Timeline line — connects to next item */}
      {!isLast && (
        <div className="absolute left-[2.625rem] top-[3.25rem] bottom-0 w-px bg-border" />
      )}

      {/* Entity icon */}
      <div className="relative z-10 mt-0.5">
        <EntityIconCircle entityType={entry.entityType} />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Main line */}
          <p className="text-sm leading-snug text-foreground">
            <span className="font-semibold">{actorDisplay}</span>{" "}
            <span className="text-muted-foreground">{actionLabel}</span>
            {entityName && (
              <>
                {" "}
                <span className="font-medium">{entityName}</span>
              </>
            )}
          </p>

          {/* Meta row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <EntityBadge entityType={entry.entityType} />
            {entry.actorEmail && (
              <>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {entry.actorEmail}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Timestamp + avatar cluster */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <ActorAvatar name={entry.actorName} />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays size={11} />
              <span className="whitespace-nowrap">{timeAgo(entry.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ isLast }: { isLast: boolean }) {
  return (
    <div className="relative flex gap-4 px-5 py-4">
      {!isLast && (
        <div className="absolute left-[2.625rem] top-[3.25rem] bottom-0 w-px bg-border" />
      )}
      <Skeleton className="relative z-10 mt-0.5 h-9 w-9 shrink-0 rounded-full" />
      <div className="flex flex-1 items-start justify-between gap-3">
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-3.5 w-2/3" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

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
  const hasDateFilter = !!(filters.dateFrom || filters.dateTo);
  const hasAnyFilter = hasDateFilter || !!filters.entityType;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Activity
          </h1>
          <p className="text-sm text-muted-foreground">
            Chronological activity across your organization
          </p>
        </div>
        {pagination && (
          <span className="rounded-pill bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            {pagination.total} event{pagination.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-card border border-border bg-card p-3 shadow-cf-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Filter size={13} />
          <span>Filter</span>
        </div>
        <div className="h-4 w-px bg-border" />

        <Select
          value={filters.entityType ?? "all"}
          onValueChange={handleEntityTypeChange}
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
              onChange={handleDateFromChange}
              placeholder="From date"
            />
          </div>
          <span className="text-xs text-muted-foreground">—</span>
          <div className="w-36">
            <DatePicker
              value={dateTo}
              onChange={handleDateToChange}
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
              onClick={() => {
                clearDateRange();
                setFilters({});
              }}
              className="h-7 gap-1.5 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
              Clear
            </Button>
          </>
        )}
      </div>

      {/* Feed */}
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        {isLoading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} isLast={i === 7} />
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
              <ActivityRow
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
