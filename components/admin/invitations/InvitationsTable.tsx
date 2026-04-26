"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Loader2, XCircle, X } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { toast } from "sonner";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RevokeInvitationButton } from "./RevokeInvitationButton";
import { ADMIN_INVITATION_STATUS_COLORS } from "@/constants/admin/colors";
import { bulkRevokeInvitationsAction } from "@/server/actions/admin/invitations";
import type { AdminInvitationRow } from "@/server/admin/invitations";
import type { PaginationMeta } from "@/utils/pagination";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
];

function buildColumns(
  selected: Set<string>,
  toggleRow: (id: string) => void,
  allChecked: boolean,
  someChecked: boolean,
  toggleAll: (checked: boolean) => void,
  pendingPageIds: string[],
): ColumnDef<AdminInvitationRow>[] {
  return [
    {
      key: "select",
      header: (
        <Checkbox
          checked={allChecked ? true : someChecked ? "indeterminate" : false}
          onCheckedChange={(v) => toggleAll(v === true)}
          aria-label="Select all pending on this page"
          disabled={pendingPageIds.length === 0}
        />
      ),
      headerClassName: "w-8",
      cell: (inv) =>
        inv.status === "pending" ? (
          <Checkbox
            checked={selected.has(inv.id)}
            onCheckedChange={() => toggleRow(inv.id)}
            aria-label={`Select invitation to ${inv.email}`}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-muted-foreground/30">-</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-12",
      cell: (inv) =>
        inv.status === "pending" ? (
          <div className="flex items-center">
            <RevokeInvitationButton invitationId={inv.id} />
          </div>
        ) : null,
    },
    {
      key: "email",
      header: "Invitee",
      cell: (inv) => (
        <>
          <p className="text-foreground text-sm font-medium">{inv.email}</p>
          <p className="text-muted-foreground text-xs">{inv.orgName}</p>
        </>
      ),
    },
    {
      key: "roleName",
      header: "Role",
      hideOnMobile: true,
      cell: (inv) => (
        <span className="text-muted-foreground text-xs capitalize">{inv.roleName}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (inv) => <StatusBadge status={inv.status} colorMap={ADMIN_INVITATION_STATUS_COLORS} />,
    },
    {
      key: "inviterName",
      header: "Invited By",
      hideOnTablet: true,
      cell: (inv) => (
        <span className="text-muted-foreground text-xs">{inv.inviterName ?? "-"}</span>
      ),
    },
    {
      key: "expiresAt",
      header: "Expires",
      hideOnMobile: true,
      cell: (inv) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Sent",
      hideOnTablet: true,
      cell: (inv) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
        </span>
      ),
    },
  ];
}

type Props = {
  data: AdminInvitationRow[];
  pagination: PaginationMeta;
};

export function InvitationsTable({ data, pagination }: Props) {
  const router = useRouter();
  const [, startUrlTransition] = useTransition();
  const [isBulkPending, startBulkTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [{ status }, setFilters] = useQueryStates(
    {
      status: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
    },
    { shallow: false, startTransition: startUrlTransition, clearOnDefault: true },
  );

  // Only pending invitations can be bulk-revoked
  const pendingPageIds = useMemo(
    () => data.filter((r) => r.status === "pending").map((r) => r.id),
    [data],
  );
  const selectedOnPage = useMemo(
    () => pendingPageIds.filter((id) => selected.has(id)),
    [pendingPageIds, selected],
  );
  const allChecked = pendingPageIds.length > 0 && selectedOnPage.length === pendingPageIds.length;
  const someChecked = selectedOnPage.length > 0 && !allChecked;

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(check: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (check) pendingPageIds.forEach((id) => next.add(id));
      else pendingPageIds.forEach((id) => next.delete(id));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleBulkRevoke() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startBulkTransition(async () => {
      const result = await bulkRevokeInvitationsAction({ invitationIds: ids });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Revoked ${result.count} invitation${result.count === 1 ? "" : "s"}.`);
      clearSelection();
      router.refresh();
    });
  }

  const columns = buildColumns(
    selected,
    toggleRow,
    allChecked,
    someChecked,
    toggleAll,
    pendingPageIds,
  );

  return (
    <>
      {selected.size > 0 && (
        <div className="rounded-card border-primary/30 bg-primary/5 mb-3 flex flex-wrap items-center justify-between gap-3 border px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-foreground font-semibold">{selected.size}</span>
            <span className="text-muted-foreground">
              pending invitation{selected.size === 1 ? "" : "s"} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-muted-foreground hover:text-foreground ml-2 inline-flex cursor-pointer items-center gap-1 text-xs"
            >
              <X size={11} /> Clear
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkRevoke}
            disabled={isBulkPending}
            className="border-warning/40 text-warning hover:bg-warning/10 cursor-pointer gap-1.5"
          >
            {isBulkPending ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
            Revoke
          </Button>
        </div>
      )}

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
    </>
  );
}
