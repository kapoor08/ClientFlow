"use client";

import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Page Header ────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon = Plus,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
}) {
  return (
    <div className="mb-3 flex items-start justify-between">
      <div>
        <h2 className="font-display text-foreground text-lg font-bold">{title}</h2>
        <p className="text-muted-foreground text-[13px]">{description}</p>
      </div>
      {actionLabel && (
        <div className="bg-primary text-primary-foreground flex h-6 items-center gap-1 rounded-md px-2.5 text-[13px] font-medium">
          <ActionIcon size={10} />
          {actionLabel}
        </div>
      )}
    </div>
  );
}

// ─── Search + Filters Bar ───────────────────────────────────────────────────

export function SearchFiltersBar({
  placeholder = "Search...",
  showDates = false,
  showFilters = false,
  showViewToggle = false,
  extraButtons,
}: {
  placeholder?: string;
  showDates?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  extraButtons?: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      {/* Search */}
      <div className="border-border bg-background flex flex-1 items-center gap-1.5 rounded-md border px-2.5 py-1.5">
        <Search size={10} className="text-muted-foreground/50" />
        <span className="text-muted-foreground/40 text-[13px]">{placeholder}</span>
      </div>

      {extraButtons}

      {/* Select dates */}
      {showDates && (
        <div className="border-border bg-background text-muted-foreground flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs">
          <Calendar size={9} />
          Select dates...
          <ChevronDown size={8} />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="border-border bg-background text-foreground flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium">
          <Filter size={9} />
          Filters
        </div>
      )}

      {/* View toggle - using proper lucide icons */}
      {showViewToggle && (
        <div className="border-border flex items-center overflow-hidden rounded-md border">
          <div className="bg-secondary flex items-center justify-center px-1.5 py-1">
            <List size={11} className="text-foreground" />
          </div>
          <div className="flex items-center justify-center px-1.5 py-1">
            <LayoutGrid size={11} className="text-muted-foreground/40" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────

export function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export function Pagination({
  showing,
  pageSize = "10 / page",
}: {
  showing: string;
  total?: number;
  pageSize?: string;
}) {
  return (
    <div className="border-border flex items-center justify-between border-t px-3 py-2">
      <span className="text-muted-foreground text-xs">{showing}</span>
      <div className="flex items-center gap-1.5">
        <span className="border-border text-muted-foreground flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[11px]">
          {pageSize}
          <ChevronDown size={7} />
        </span>
        <div className="flex items-center gap-0.5 text-xs">
          <span className="text-muted-foreground/40 px-0.5">
            <ChevronLeft size={8} />
          </span>
          <span className="text-muted-foreground/30 text-[11px]">Previous</span>
          <span className="bg-primary text-primary-foreground mx-0.5 flex h-4 w-4 items-center justify-center rounded text-[11px] font-medium">
            1
          </span>
          <span className="text-muted-foreground flex h-4 w-4 items-center justify-center rounded text-[11px]">
            2
          </span>
          <span className="text-muted-foreground/30 text-[11px]">Next</span>
          <span className="text-muted-foreground/40 px-0.5">
            <ChevronRight size={8} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Action Icons (eye, edit, trash) ────────────────────────────────────────

export function ActionIcons() {
  return (
    <div className="flex items-center gap-1.5">
      <Eye size={9} className="text-muted-foreground/30" />
      <Pencil size={9} className="text-muted-foreground/30" />
      <Trash2 size={9} className="text-muted-foreground/30" />
    </div>
  );
}
