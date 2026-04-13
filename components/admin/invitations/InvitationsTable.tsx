"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RevokeInvitationButton } from "./RevokeInvitationButton";
import { ADMIN_INVITATION_STATUS_COLORS } from "@/constants/admin/colors";
import type { AdminInvitationRow } from "@/server/admin/invitations";
import type { PaginationMeta } from "@/utils/pagination";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
];

const columns: ColumnDef<AdminInvitationRow>[] = [
  {
    key: "email",
    header: "Invitee",
    cell: (inv) => (
      <>
        <p className="text-sm font-medium text-foreground">{inv.email}</p>
        <p className="text-xs text-muted-foreground">{inv.orgName}</p>
      </>
    ),
  },
  {
    key: "roleName",
    header: "Role",
    hideOnMobile: true,
    cell: (inv) => (
      <span className="text-xs text-muted-foreground capitalize">{inv.roleName}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (inv) => (
      <StatusBadge status={inv.status} colorMap={ADMIN_INVITATION_STATUS_COLORS} />
    ),
  },
  {
    key: "inviterName",
    header: "Invited By",
    hideOnTablet: true,
    cell: (inv) => (
      <span className="text-xs text-muted-foreground">{inv.inviterName ?? "-"}</span>
    ),
  },
  {
    key: "expiresAt",
    header: "Expires",
    hideOnMobile: true,
    cell: (inv) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true })}
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Sent",
    hideOnTablet: true,
    cell: (inv) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
      </span>
    ),
  },
  {
    key: "actions",
    header: "",
    headerClassName: "w-12",
    cell: (inv) =>
      inv.status === "pending" ? (
        <div className="flex items-center justify-end">
          <RevokeInvitationButton invitationId={inv.id} />
        </div>
      ) : null,
  },
];

type Props = {
  data: AdminInvitationRow[];
  pagination: PaginationMeta;
};

export function InvitationsTable({ data, pagination }: Props) {
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
      searchPlaceholder="Search by email or organization…"
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
      emptyTitle="No invitations found."
      emptyDescription="Try adjusting your search or filters."
    />
  );
}
