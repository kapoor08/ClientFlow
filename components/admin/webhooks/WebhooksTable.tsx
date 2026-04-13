"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { WebhookActions } from "./WebhookActions";
import type { AdminWebhookRow } from "@/server/admin/webhooks";
import type { PaginationMeta } from "@/utils/pagination";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const WEBHOOK_STATUS_COLORS: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-secondary text-muted-foreground",
};

const columns: ColumnDef<AdminWebhookRow>[] = [
  {
    key: "name",
    header: "Webhook",
    cell: (w) => (
      <>
        <p className="text-sm font-medium text-foreground">{w.name}</p>
        <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">{w.url}</p>
      </>
    ),
  },
  {
    key: "orgName",
    header: "Organization",
    hideOnMobile: true,
    cell: (w) => <span className="text-sm text-muted-foreground">{w.orgName}</span>,
  },
  {
    key: "isActive",
    header: "Status",
    cell: (w) => (
      <StatusBadge
        status={w.isActive ? "active" : "inactive"}
        colorMap={WEBHOOK_STATUS_COLORS}
      />
    ),
  },
  {
    key: "events",
    header: "Events",
    hideOnTablet: true,
    cell: (w) => (
      <span className="text-xs text-muted-foreground">
        {w.events?.length ? `${w.events.length} event${w.events.length !== 1 ? "s" : ""}` : "All"}
      </span>
    ),
  },
  {
    key: "lastTriggeredAt",
    header: "Last Triggered",
    hideOnMobile: true,
    cell: (w) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {w.lastTriggeredAt
          ? formatDistanceToNow(new Date(w.lastTriggeredAt), { addSuffix: true })
          : "Never"}
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    hideOnTablet: true,
    cell: (w) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}
      </span>
    ),
  },
  {
    key: "actions",
    header: "",
    headerClassName: "w-12",
    cell: (w) => (
      <div className="flex items-center justify-end">
        <WebhookActions webhookId={w.id} isActive={w.isActive} />
      </div>
    ),
  },
];

type Props = {
  data: AdminWebhookRow[];
  pagination: PaginationMeta;
};

export function WebhooksTable({ data, pagination }: Props) {
  const [, startTransition] = useTransition();

  const [{ status }, setFilters] = useQueryStates(
    {
      status: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowKey={(row) => row.id}
      searchPlaceholder="Search by name, URL, or organization…"
      searchExtra={
        <FiltersPopover
          filters={[
            {
              key: "status",
              label: "Status",
              options: STATUS_OPTIONS,
              value: status,
              onChange: (v) => setFilters({ status: v || null, page: null }),
            },
          ]}
        />
      }
      pagination={pagination}
      emptyTitle="No webhooks found."
      emptyDescription="Try adjusting your search or filters."
    />
  );
}
