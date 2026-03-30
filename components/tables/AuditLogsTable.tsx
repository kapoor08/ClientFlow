"use client";

import { FileCode } from "lucide-react";
import { DataTable, DateRangeFilter, type ColumnDef } from "@/components/data-table";
import type { AuditLogItem } from "@/core/audit/entity";
import type { PaginationMeta } from "@/lib/pagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ─── Column definitions ───────────────────────────────────────────────────────

const columns: ColumnDef<AuditLogItem>[] = [
  {
    key: "createdAt",
    header: "Timestamp",
    cell: (entry) => (
      <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
        {formatDate(entry.createdAt)}
      </span>
    ),
  },
  {
    key: "actorName",
    header: "Actor",
    cell: (entry) => (
      <div>
        <p className="text-sm font-medium leading-tight text-foreground">
          {entry.actorName ?? "System"}
        </p>
        {entry.actorEmail && (
          <p className="text-xs text-muted-foreground">{entry.actorEmail}</p>
        )}
      </div>
    ),
  },
  {
    key: "action",
    header: "Action",
    cell: (entry) => (
      <span className="inline-flex items-center gap-1 rounded-pill bg-secondary px-2 py-0.5 font-mono text-xs font-medium text-foreground">
        <FileCode size={10} />
        {entry.action}
      </span>
    ),
  },
  {
    key: "entityType",
    header: "Entity",
    hideOnMobile: true,
    cell: (entry) => (
      <span className="font-mono text-xs text-muted-foreground">
        {entry.entityType}
        {entry.entityId && (
          <span className="ml-1 text-muted-foreground/60">
            :{entry.entityId.slice(0, 8)}…
          </span>
        )}
      </span>
    ),
  },
  {
    key: "ipAddress",
    header: "IP",
    hideOnTablet: true,
    cell: (entry) => (
      <span className="font-mono text-xs text-muted-foreground">
        {entry.ipAddress ?? "—"}
      </span>
    ),
  },
  {
    key: "userAgent",
    header: "User Agent",
    hideOnTablet: true,
    cell: (entry) => (
      <span className="max-w-xs truncate text-xs text-muted-foreground">
        {entry.userAgent ?? "—"}
      </span>
    ),
  },
];

// ─── Export ───────────────────────────────────────────────────────────────────

type AuditLogsTableProps = {
  initialLogs: AuditLogItem[];
  pagination: PaginationMeta;
  exportButton?: React.ReactNode;
};

export function AuditLogsTable({
  initialLogs,
  pagination,
  exportButton,
}: AuditLogsTableProps) {
  return (
    <DataTable
      data={initialLogs}
      columns={columns}
      getRowKey={(e) => e.id}
      searchPlaceholder="Search by action, actor, or entity…"
      searchExtra={
        <div className="flex items-center gap-2">
          <DateRangeFilter />
          {exportButton}
        </div>
      }
      pagination={pagination}
      emptyTitle="No audit events found."
      emptyDescription="Audit events are recorded automatically as your team takes actions."
    />
  );
}
