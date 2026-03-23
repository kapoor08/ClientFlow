"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivity } from "@/core/activity/useCase";
import type { ActivityFilters, ActivityEntry } from "@/core/activity/entity";
import {
  ENTITY_TYPE_OPTIONS,
  getActionLabel,
  getEntityName,
  getEntityBadgeStyle,
} from "@/core/activity/entity";

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

// ─── Actor avatar ──────────────────────────────────────────────────────────────

function ActorAvatar({ name }: { name: string | null }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-primary">
      {getInitials(name)}
    </div>
  );
}

// ─── Entity badge ─────────────────────────────────────────────────────────────

function EntityBadge({ entityType }: { entityType: string }) {
  return (
    <span
      className={`rounded-pill px-2 py-0.5 text-[10px] font-medium capitalize ${getEntityBadgeStyle(entityType)}`}
    >
      {entityType}
    </span>
  );
}

// ─── Activity row ─────────────────────────────────────────────────────────────

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const actionLabel = getActionLabel(entry.action);
  const entityName = getEntityName(entry);
  const actorDisplay = entry.actorName ?? "System";

  return (
    <div className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-secondary/50 transition-colors">
      <ActorAvatar name={entry.actorName} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          <span className="font-medium">{actorDisplay}</span>{" "}
          <span className="text-muted-foreground">{actionLabel}</span>
          {entityName && (
            <>
              {" "}
              <span className="font-medium">{entityName}</span>
            </>
          )}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {timeAgo(entry.createdAt)}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <EntityBadge entityType={entry.entityType} />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-3 py-3">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ActivityLogsPage = () => {
  const [filters, setFilters] = useState<ActivityFilters>({});

  const { data, isLoading } = useActivity(filters);

  const entries = data?.entries ?? [];
  const pagination = data?.pagination;

  function handleEntityTypeChange(value: string) {
    setFilters((f) => ({ ...f, entityType: value === "all" ? undefined : value, page: undefined }));
  }

  function handlePageChange(delta: number) {
    setFilters((f) => ({ ...f, page: (f.page ?? 1) + delta }));
  }

  const currentPage = filters.page ?? 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Activity
        </h1>
        <p className="text-sm text-muted-foreground">
          Chronological activity across your organization
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex items-center gap-3">
        <Select
          value={filters.entityType ?? "all"}
          onValueChange={handleEntityTypeChange}
        >
          <SelectTrigger className="w-44">
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
      </div>

      {/* Feed */}
      <div className="rounded-card border border-border bg-card shadow-cf-1">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {filters.entityType
              ? "No activity found for this filter."
              : "No activity recorded yet."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.pageCount} (
            {pagination.total} events)
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
