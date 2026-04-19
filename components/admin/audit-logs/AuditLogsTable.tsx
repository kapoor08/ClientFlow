"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Download } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { DataTable, DateRangeFilter, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import type { AdminAuditLogRow } from "@/server/admin/audit-logs";
import type { PaginationMeta } from "@/utils/pagination";

const ENTITY_TYPE_OPTIONS = [
  { value: "organization", label: "Organization" },
  { value: "user", label: "User" },
  { value: "project", label: "Project" },
  { value: "task", label: "Task" },
  { value: "client", label: "Client" },
  { value: "invoice", label: "Invoice" },
  { value: "api_key", label: "API Key" },
  { value: "webhook", label: "Webhook" },
];

const columns: ColumnDef<AdminAuditLogRow>[] = [
  {
    key: "action",
    header: "Action",
    cell: (log) => (
      <>
        <p className="font-medium text-foreground font-mono text-xs">{log.action}</p>
        <p className="text-[10px] text-muted-foreground">
          {log.entityType}
          {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}
        </p>
      </>
    ),
  },
  {
    key: "actor",
    header: "Actor",
    hideOnMobile: true,
    cell: (log) =>
      log.actorName ? (
        <>
          <p className="text-sm text-foreground">{log.actorName}</p>
          <p className="text-xs text-muted-foreground">{log.actorEmail}</p>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">System</span>
      ),
  },
  {
    key: "orgName",
    header: "Organization",
    hideOnTablet: true,
    cell: (log) => <span className="text-sm text-muted-foreground">{log.orgName ?? "-"}</span>,
  },
  {
    key: "ipAddress",
    header: "IP",
    hideOnMobile: true,
    cell: (log) => (
      <span className="font-mono text-xs text-muted-foreground">{log.ipAddress ?? "-"}</span>
    ),
  },
  {
    key: "createdAt",
    header: "When",
    cell: (log) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
      </span>
    ),
  },
];

type Props = {
  data: AdminAuditLogRow[];
  pagination: PaginationMeta;
};

export function AuditLogsTable({ data, pagination }: Props) {
  const [, startTransition] = useTransition();
  const searchParams = useSearchParams();

  const [{ entityType }, setFilters] = useQueryStates(
    {
      entityType: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  // Build export URL that preserves the current filters
  const exportUrl = (() => {
    const url = new URL("/api/admin/audit-logs/export", "http://_");
    const q = searchParams.get("q");
    const et = searchParams.get("entityType");
    const from = searchParams.get("dateFrom");
    const to = searchParams.get("dateTo");
    if (q) url.searchParams.set("q", q);
    if (et) url.searchParams.set("entityType", et);
    if (from) url.searchParams.set("dateFrom", from);
    if (to) url.searchParams.set("dateTo", to);
    return url.pathname + (url.search || "");
  })();

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowKey={(row) => row.id}
      searchPlaceholder="Search by action or entity type…"
      searchExtra={
        <>
          <DateRangeFilter />
          <FiltersPopover
            filters={[
              {
                key: "entityType",
                label: "Entity Type",
                options: ENTITY_TYPE_OPTIONS,
                value: entityType,
                onChange: (v) => setFilters({ entityType: v || null, page: null }),
              },
            ]}
          />
          <Button variant="outline" size="sm" asChild className="cursor-pointer gap-1.5">
            <a href={exportUrl} download>
              <Download size={13} />
              Export CSV
            </a>
          </Button>
        </>
      }
      pagination={pagination}
      emptyTitle="No audit logs found."
      emptyDescription="Try adjusting your search or filters."
    />
  );
}
