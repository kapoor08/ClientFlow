"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Building2, ExternalLink, Loader2, PowerOff, Power, X } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { toast } from "sonner";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminOrgActions } from "./AdminOrgActions";
import {
  bulkSuspendOrgsAction,
  bulkRestoreOrgsAction,
} from "@/server/actions/admin/organizations";
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

function buildColumns(
  selected: Set<string>,
  toggleRow: (id: string) => void,
  allChecked: boolean,
  someChecked: boolean,
  toggleAll: (checked: boolean) => void,
): ColumnDef<AdminOrgRow>[] {
  return [
    {
      key: "select",
      header: "",
      headerClassName: "w-8",
      cell: (org) => (
        <Checkbox
          checked={selected.has(org.id)}
          onCheckedChange={() => toggleRow(org.id)}
          aria-label={`Select ${org.name}`}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-16",
      cell: (org) => (
        <div className="flex items-center gap-1">
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
    {
      key: "name",
      header: (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allChecked ? true : someChecked ? "indeterminate" : false}
            onCheckedChange={(v) => toggleAll(v === true)}
            aria-label="Select all on this page"
          />
          <span>Organization</span>
        </div>
      ),
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
  ];
}

type Props = {
  data: AdminOrgRow[];
  pagination: PaginationMeta;
};

export function OrganizationsTable({ data, pagination }: Props) {
  const router = useRouter();
  const [, startUrlTransition] = useTransition();
  const [isBulkPending, startBulkTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const [{ plan, status }, setFilters] = useQueryStates(
    {
      plan: parseAsString.withDefault(""),
      status: parseAsString.withDefault(""),
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

  function handleBulkRestore() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startBulkTransition(async () => {
      const result = await bulkRestoreOrgsAction({ orgIds: ids });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Restored ${result.count} organization${result.count === 1 ? "" : "s"}.`);
      clearSelection();
      router.refresh();
    });
  }

  function handleBulkSuspendConfirm() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startBulkTransition(async () => {
      const result = await bulkSuspendOrgsAction({ orgIds: ids, reason: suspendReason });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Suspended ${result.count} organization${result.count === 1 ? "" : "s"}.`);
      setSuspendDialogOpen(false);
      setSuspendReason("");
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
              onClick={handleBulkRestore}
              disabled={isBulkPending}
              className="gap-1.5 cursor-pointer"
            >
              {isBulkPending ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
              Restore
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuspendDialogOpen(true)}
              disabled={isBulkPending}
              className="gap-1.5 cursor-pointer border-warning/40 text-warning hover:bg-warning/10"
            >
              <PowerOff size={13} />
              Suspend
            </Button>
          </div>
        </div>
      )}

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

      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend {selected.size} organization{selected.size === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>
              All members of the selected organizations will lose access immediately. They will see
              a suspension notice until you restore the org.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="suspend-reason">Reason</Label>
            <Textarea
              id="suspend-reason"
              placeholder="Payment overdue, ToS violation, etc."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Logged against every org in the platform audit trail.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSuspendDialogOpen(false)}
              disabled={isBulkPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkSuspendConfirm}
              disabled={isBulkPending || suspendReason.trim().length < 3}
            >
              {isBulkPending ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" /> Suspending…
                </>
              ) : (
                `Suspend ${selected.size}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
