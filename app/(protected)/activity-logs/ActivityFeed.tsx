"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import {
  DateRangeFilter,
  FiltersPopover,
  RowActions,
  type ColumnDef,
  type FilterGroupConfig,
} from "@/components/data-table";
import { DataTable } from "@/components/data-table";
import {
  ENTITY_TYPE_OPTIONS,
  getActionLabel,
  getEntityBadgeStyle,
  getEntityName,
} from "@/core/activity/entity";
import type { ActivityEntry } from "@/core/activity/entity";
import type { PaginationMeta } from "@/lib/pagination";
import { ActivityDetailModal } from "./ActivityDetailModal";
import { formatDate, formatTimeAgo, formatMinutes } from "@/utils/date";
import { getInitials } from "@/utils/user";
import { formatCurrency } from "@/utils/currency";

// ─── Filter options ───────────────────────────────────────────────────────────

const ENTITY_FILTER_OPTIONS = ENTITY_TYPE_OPTIONS.filter(
  (o) => o.value !== "all",
).map((o) => ({ label: o.label, value: o.value }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Keys that are always skipped in the summary (shown elsewhere or redundant)
const SKIP_KEYS = new Set(["id", "entityId", "name", "email", "overrides"]);

/** Format metadata into a short readable summary for the table cell */
function formatMetaSummary(meta: Record<string, unknown> | null): string {
  if (!meta) return "-";

  const parts: string[] = [];

  for (const [k, v] of Object.entries(meta)) {
    if (parts.length >= 3) break;
    if (SKIP_KEYS.has(k)) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && UUID_RE.test(v)) continue; // skip raw UUIDs
    if (typeof v === "object") continue; // skip nested objects

    if (k === "minutes" && typeof v === "number") {
      parts.push(formatMinutes(v));
    } else if (k === "amountCents" && typeof v === "number") {
      parts.push(formatCurrency(v));
    } else if (k === "number") {
      // Invoice number - show as-is, prominent
      parts.push(String(v));
    } else if (k === "title" && parts.some((p) => p.startsWith("INV-"))) {
      // Skip title if invoice number already shown
    } else {
      // Convert key: "projectId" → skip (UUID), "project" → "Project: X"
      const label = k
        .replace(/Id$/, "")
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase());
      const rawVal = String(v);
      // Capitalize single-word values (status, priority, role, etc.)
      const displayVal = /^[a-z_]+$/.test(rawVal)
        ? rawVal.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
        : rawVal;
      parts.push(`${label}: ${displayVal}`);
    }
  }

  return parts.length ? parts.join(" · ") : "-";
}

// ─── Column builder (needs onPreview callback) ────────────────────────────────

function buildColumns(
  onPreview: (entry: ActivityEntry) => void,
): ColumnDef<ActivityEntry>[] {
  return [
    {
      key: "createdAt",
      header: "Timestamp",
      cell: (entry) => (
        <div>
          <p className="whitespace-nowrap font-mono text-xs text-foreground">
            {formatDate(entry.createdAt, { withTime: true })}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {formatTimeAgo(entry.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "actorName",
      header: "Actor",
      cell: (entry) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
            {getInitials(entry.actorName)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight text-foreground">
              {entry.actorName ?? "System"}
            </p>
            {entry.actorEmail && (
              <p className="truncate text-xs text-muted-foreground">
                {entry.actorEmail}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (entry) => {
        const name = getEntityName(entry);
        return (
          <div>
            <p className="text-sm text-foreground">
              {getActionLabel(entry.action)}
            </p>
            {name && (
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {name}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "entityType",
      header: "Entity",
      hideOnMobile: true,
      cell: (entry) => (
        <span
          className={`w-fit rounded-pill px-2 py-0.5 text-[10px] font-semibold capitalize tracking-wide ${getEntityBadgeStyle(entry.entityType)}`}
        >
          {entry.entityType.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "metadata",
      header: "Details",
      hideOnTablet: true,
      cell: (entry) => (
        <p className="max-w-55 truncate text-xs text-muted-foreground">
          {formatMetaSummary(entry.metadata)}
        </p>
      ),
    },
    {
      key: "id",
      header: "",
      cell: (entry) => <RowActions onPreview={() => onPreview(entry)} />,
    },
  ];
}

// ─── Export button ────────────────────────────────────────────────────────────

function ExportButton({ q, entityType }: { q: string; entityType: string }) {
  function handleExport() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (entityType) params.set("entityType", entityType);
    window.location.href = `/api/activity-logs/export?${params.toString()}`;
  }

  return (
    <Button
      variant="default"
      size="sm"
      className="cursor-pointer"
      onClick={handleExport}
    >
      <Download size={13} className="mr-1" />
      Export CSV
    </Button>
  );
}

// ─── ActivityFeed ─────────────────────────────────────────────────────────────

type ActivityFeedProps = {
  entries: ActivityEntry[];
  pagination: PaginationMeta;
};

export function ActivityFeed({ entries, pagination }: ActivityFeedProps) {
  const [, startTransition] = useTransition();
  const [selectedEntry, setSelectedEntry] = useState<ActivityEntry | null>(
    null,
  );

  const [q] = useQueryState(
    "q",
    parseAsString
      .withDefault("")
      .withOptions({ shallow: false, startTransition, clearOnDefault: true }),
  );

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

  const columns = buildColumns(setSelectedEntry);

  return (
    <>
      <DataTable
        data={entries}
        columns={columns}
        getRowKey={(e) => e.id}
        searchPlaceholder="Search by action, actor, or entity…"
        searchExtra={
          <div className="flex items-center gap-2">
            <DateRangeFilter />
            <FiltersPopover filters={filters} />
            <ExportButton q={q} entityType={entityType} />
          </div>
        }
        pagination={pagination}
        emptyTitle="No activity found."
        emptyDescription="Activity will appear here as your team takes actions across the workspace."
      />

      <ActivityDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </>
  );
}
