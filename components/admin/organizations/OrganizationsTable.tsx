"use client";

import Link from "next/link";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Building2, ExternalLink } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AdminOrgActions } from "./AdminOrgActions";
import type { AdminOrgRow } from "@/server/admin/organizations";
import type { PaginationMeta } from "@/utils/pagination";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-secondary text-muted-foreground",
  starter: "bg-info/10 text-info",
  professional: "bg-brand-100 text-primary",
  enterprise: "bg-success/10 text-success",
};

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const columns: ColumnDef<AdminOrgRow>[] = [
  {
    key: "name",
    header: "Organization",
    sortable: true,
    cell: (org) => (
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100">
          <Building2 size={13} className="text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{org.name}</p>
          <p className="text-[10px] text-muted-foreground font-mono">{org.slug}</p>
        </div>
      </div>
    ),
  },
  {
    key: "plan",
    header: "Plan",
    cell: (org) => <StatusBadge status={org.planCode ?? "free"} colorMap={PLAN_COLORS} />,
  },
  {
    key: "memberCount",
    header: "Members",
    hideOnMobile: true,
    cell: (org) => <span className="text-muted-foreground">{org.memberCount}</span>,
  },
  {
    key: "projectCount",
    header: "Projects",
    hideOnTablet: true,
    cell: (org) => <span className="text-muted-foreground">{org.projectCount}</span>,
  },
  {
    key: "clientCount",
    header: "Clients",
    hideOnTablet: true,
    cell: (org) => <span className="text-muted-foreground">{org.clientCount}</span>,
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    hideOnMobile: true,
    cell: (org) => (
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    hideOnMobile: true,
    cell: (org) =>
      org.subscriptionStatus ? (
        <StatusBadge status={org.subscriptionStatus} />
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      ),
  },
  {
    key: "actions",
    header: "",
    headerClassName: "w-16",
    cell: (org) => (
      <div className="flex items-center justify-end gap-1">
        <Link
          href={`/admin/organizations/${org.id}`}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="View details"
        >
          <ExternalLink size={13} />
        </Link>
        <AdminOrgActions orgId={org.id} orgName={org.name} isActive={org.isActive} status={org.status} />
      </div>
    ),
  },
];

type Props = {
  data: AdminOrgRow[];
  pagination: PaginationMeta;
};

export function OrganizationsTable({ data, pagination }: Props) {
  const [, startTransition] = useTransition();

  const [{ plan, status }, setFilters] = useQueryStates(
    {
      plan: parseAsString.withDefault(""),
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
      searchPlaceholder="Search organizations…"
      searchExtra={
        <FiltersPopover
          filters={[
            {
              key: "plan",
              label: "Plan",
              options: PLAN_OPTIONS,
              value: plan,
              onChange: (v) => setFilters({ plan: v || null, page: null }),
            },
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
      emptyTitle="No organizations found."
      emptyDescription="Try adjusting your search or filters."
    />
  );
}
