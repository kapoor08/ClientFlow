"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ShieldCheck,
  ExternalLink,
  MailCheck,
  KeyRound,
  LogOut,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { toast } from "sonner";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminUserActions } from "./AdminUserActions";
import {
  bulkRevokeUserSessionsAction,
  bulkDeleteUsersAction,
} from "@/server/actions/admin/users";
import type { AdminUserRow } from "@/server/admin/users";
import type { PaginationMeta } from "@/utils/pagination";

const VERIFIED_OPTIONS = [
  { value: "true", label: "Verified" },
  { value: "false", label: "Unverified" },
];

const ADMIN_OPTIONS = [
  { value: "true", label: "Platform admins only" },
];

function buildColumns(
  selected: Set<string>,
  toggleRow: (id: string) => void,
  allChecked: boolean,
  someChecked: boolean,
  toggleAll: (checked: boolean) => void,
): ColumnDef<AdminUserRow>[] {
  return [
    {
      key: "select",
      header: (
        <Checkbox
          checked={allChecked ? true : someChecked ? "indeterminate" : false}
          onCheckedChange={(v) => toggleAll(v === true)}
          aria-label="Select all on this page"
        />
      ),
      headerClassName: "w-8",
      cell: (u) => (
        <Checkbox
          checked={selected.has(u.id)}
          onCheckedChange={() => toggleRow(u.id)}
          aria-label={`Select ${u.name}`}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-16",
      cell: (u) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/users/${u.id}`}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="View profile"
          >
            <ExternalLink size={13} />
          </Link>
          <AdminUserActions userId={u.id} userName={u.name} />
        </div>
      ),
    },
    {
      key: "name",
      header: "User",
      sortable: true,
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          {u.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.image} alt={u.name} className="h-7 w-7 rounded-full object-cover shrink-0" />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-primary">
              {u.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-foreground truncate">{u.name}</p>
              {u.isPlatformAdmin && (
                <ShieldCheck size={12} className="text-danger shrink-0" aria-label="Platform Admin" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "orgCount",
      header: "Orgs",
      hideOnMobile: true,
      cell: (u) => <span className="text-muted-foreground">{u.orgCount}</span>,
    },
    {
      key: "emailVerified",
      header: "Verified",
      hideOnTablet: true,
      cell: (u) => (
        <MailCheck size={14} className={u.emailVerified ? "text-success" : "text-muted-foreground/40"} />
      ),
    },
    {
      key: "twoFactorEnabled",
      header: "MFA",
      hideOnTablet: true,
      cell: (u) => (
        <KeyRound size={14} className={u.twoFactorEnabled ? "text-success" : "text-muted-foreground/40"} />
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      hideOnMobile: true,
      cell: (u) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
        </span>
      ),
    },
  ];
}

type Props = {
  data: AdminUserRow[];
  pagination: PaginationMeta;
};

export function UsersTable({ data, pagination }: Props) {
  const router = useRouter();
  const [, startUrlTransition] = useTransition();
  const [isBulkPending, startBulkTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [{ verified, platformAdmin }, setFilters] = useQueryStates(
    {
      verified: parseAsString.withDefault(""),
      platformAdmin: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
    },
    { shallow: false, startTransition: startUrlTransition, clearOnDefault: true },
  );

  const pageIds = useMemo(() => data.map((r) => r.id), [data]);
  const selectedOnPage = useMemo(
    () => pageIds.filter((id) => selected.has(id)),
    [pageIds, selected],
  );
  const allChecked = pageIds.length > 0 && selectedOnPage.length === pageIds.length;
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
      if (check) pageIds.forEach((id) => next.add(id));
      else pageIds.forEach((id) => next.delete(id));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleBulkRevokeSessions() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startBulkTransition(async () => {
      const result = await bulkRevokeUserSessionsAction({ userIds: ids });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Revoked sessions for ${result.count} user${result.count === 1 ? "" : "s"}.`);
      clearSelection();
      router.refresh();
    });
  }

  function handleBulkDeleteConfirm() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startBulkTransition(async () => {
      const result = await bulkDeleteUsersAction({ userIds: ids });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Deleted ${result.count} user${result.count === 1 ? "" : "s"}.`);
      setDeleteDialogOpen(false);
      clearSelection();
      router.refresh();
    });
  }

  const columns = buildColumns(selected, toggleRow, allChecked, someChecked, toggleAll);

  return (
    <>
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-card border border-primary/30 bg-primary/5 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{selected.size}</span>
            <span className="text-muted-foreground">selected</span>
            <button
              onClick={clearSelection}
              className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={11} /> Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRevokeSessions}
              disabled={isBulkPending}
              className="gap-1.5 cursor-pointer border-warning/40 text-warning hover:bg-warning/10"
            >
              {isBulkPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <LogOut size={13} />
              )}
              Revoke sessions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isBulkPending}
              className="gap-1.5 cursor-pointer border-danger/40 text-danger hover:bg-danger/10"
            >
              <Trash2 size={13} />
              Delete
            </Button>
          </div>
        </div>
      )}

      <DataTable
        data={data}
        columns={columns}
        getRowKey={(row) => row.id}
        searchPlaceholder="Search users…"
        searchExtra={
          <FiltersPopover
            filters={[
              {
                key: "verified",
                label: "Email",
                options: VERIFIED_OPTIONS,
                value: verified,
                onChange: (v) => setFilters({ verified: v || null, page: null }),
              },
              {
                key: "platformAdmin",
                label: "Role",
                options: ADMIN_OPTIONS,
                value: platformAdmin,
                onChange: (v) => setFilters({ platformAdmin: v || null, page: null }),
              },
            ]}
          />
        }
        pagination={pagination}
        emptyTitle="No users found."
        emptyDescription="Try adjusting your search or filters."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} user{selected.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Their accounts and all memberships will be permanently deleted. Your own account
              will be skipped if selected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={isBulkPending}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {isBulkPending ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" /> Deleting…
                </>
              ) : (
                `Delete ${selected.size}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
