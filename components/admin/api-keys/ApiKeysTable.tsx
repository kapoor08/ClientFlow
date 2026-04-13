"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ApiKeyActions } from "./ApiKeyActions";
import { ADMIN_API_KEY_STATUS_COLORS } from "@/constants/admin/colors";
import type { AdminApiKeyRow } from "@/server/admin/api-keys";
import type { PaginationMeta } from "@/utils/pagination";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
];

function getKeyStatus(row: AdminApiKeyRow): string {
  if (row.revokedAt) return "revoked";
  if (row.expiresAt && new Date(row.expiresAt) < new Date()) return "expired";
  return "active";
}

const columns: ColumnDef<AdminApiKeyRow>[] = [
  {
    key: "name",
    header: "Key",
    cell: (k) => (
      <>
        <p className="text-sm font-medium text-foreground">{k.name}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{k.keyPrefix}…</p>
      </>
    ),
  },
  {
    key: "orgName",
    header: "Organization",
    hideOnMobile: true,
    cell: (k) => <span className="text-sm text-muted-foreground">{k.orgName}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (k) => (
      <StatusBadge status={getKeyStatus(k)} colorMap={ADMIN_API_KEY_STATUS_COLORS} />
    ),
  },
  {
    key: "creatorName",
    header: "Created By",
    hideOnTablet: true,
    cell: (k) => (
      <span className="text-xs text-muted-foreground">{k.creatorName ?? "-"}</span>
    ),
  },
  {
    key: "lastUsedAt",
    header: "Last Used",
    hideOnMobile: true,
    cell: (k) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {k.lastUsedAt
          ? formatDistanceToNow(new Date(k.lastUsedAt), { addSuffix: true })
          : "Never"}
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    hideOnTablet: true,
    cell: (k) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(k.createdAt), { addSuffix: true })}
      </span>
    ),
  },
  {
    key: "actions",
    header: "",
    headerClassName: "w-12",
    cell: (k) => (
      <div className="flex items-center justify-end">
        <ApiKeyActions keyId={k.id} isActive={getKeyStatus(k) === "active"} />
      </div>
    ),
  },
];

type Props = {
  data: AdminApiKeyRow[];
  pagination: PaginationMeta;
};

export function ApiKeysTable({ data, pagination }: Props) {
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
      searchPlaceholder="Search by key name or organization…"
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
      emptyTitle="No API keys found."
      emptyDescription="Try adjusting your search or filters."
    />
  );
}
