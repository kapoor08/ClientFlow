"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, CheckCircle2, Send, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { parseAsString, useQueryState } from "nuqs";
import {
  DataTable,
  DateRangeFilter,
  FiltersPopover,
  type ColumnDef,
  type FilterGroupConfig,
} from "@/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { InvoiceListItem } from "@/core/invoices/entity";
import type { PaginationMeta } from "@/lib/pagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground",
  sent: "bg-info/10 text-info",
  paid: "bg-success/10 text-success",
  payment_failed: "bg-destructive/10 text-destructive",
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "payment_failed", label: "Payment Failed" },
];

function formatCents(cents: number | null, currency: string | null): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  });
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Actions cell ─────────────────────────────────────────────────────────────

function InvoiceActionsCell({
  invoice,
  onAction,
  busyId,
}: {
  invoice: InvoiceListItem;
  onAction: (id: string, action: "mark_paid" | "mark_sent" | "delete") => void;
  busyId: string | null;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const busy = busyId === invoice.id;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={busy}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {invoice.invoiceUrl && (
            <DropdownMenuItem asChild>
              <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Invoice
              </a>
            </DropdownMenuItem>
          )}
          {invoice.isManual && invoice.status === "draft" && (
            <DropdownMenuItem onClick={() => onAction(invoice.id, "mark_sent")}>
              <Send className="mr-2 h-4 w-4" />
              Mark as Sent
            </DropdownMenuItem>
          )}
          {invoice.isManual && invoice.status !== "paid" && (
            <DropdownMenuItem onClick={() => onAction(invoice.id, "mark_paid")}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Paid
            </DropdownMenuItem>
          )}
          {invoice.isManual && invoice.status !== "paid" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete invoice{" "}
            <span className="font-medium">
              {invoice.number ?? invoice.id.slice(0, 8).toUpperCase()}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setDeleteOpen(false);
                onAction(invoice.id, "delete");
              }}
              className="cursor-pointer"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(
  busyId: string | null,
  onAction: (id: string, action: "mark_paid" | "mark_sent" | "delete") => void,
): ColumnDef<InvoiceListItem>[] {
  return [
    {
      key: "number",
      header: "Invoice",
      sortKey: "number",
      cell: (inv) => (
        <div>
          <div className="text-sm font-medium text-foreground">
            {inv.number ?? inv.id.slice(0, 8).toUpperCase()}
          </div>
          {inv.title && (
            <div className="max-w-[180px] truncate text-xs text-muted-foreground">
              {inv.title}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "clientName",
      header: "Client",
      cell: (inv) => (
        <span className="text-sm text-muted-foreground">{inv.clientName ?? "—"}</span>
      ),
    },
    {
      key: "amountDueCents",
      header: "Amount",
      sortKey: "amountDueCents",
      cell: (inv) => (
        <span className="text-sm font-medium text-foreground">
          {formatCents(
            inv.status === "paid" ? inv.amountPaidCents : inv.amountDueCents,
            inv.currencyCode,
          )}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (inv) => (
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[inv.status] ?? "bg-secondary text-muted-foreground"}`}
          >
            {inv.status.replace("_", " ")}
          </span>
          {inv.isManual && (
            <span className="inline-flex rounded-pill bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              Manual
            </span>
          )}
        </div>
      ),
    },
    {
      key: "dueAt",
      header: "Date",
      sortKey: "dueAt",
      cell: (inv) => (
        <span className="text-xs text-muted-foreground">
          {inv.status === "paid" ? formatDate(inv.paidAt) : formatDate(inv.dueAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (inv) => (
        <InvoiceActionsCell invoice={inv} onAction={onAction} busyId={busyId} />
      ),
    },
  ];
}

// ─── InvoicesTable ────────────────────────────────────────────────────────────

type Props = {
  initialInvoices: InvoiceListItem[];
  pagination: PaginationMeta;
};

export function InvoicesTable({ initialInvoices, pagination }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("").withOptions({ shallow: false, startTransition, clearOnDefault: true }),
  );

  const filterGroups: FilterGroupConfig[] = [
    {
      label: "Status",
      key: "status",
      options: STATUS_OPTIONS,
      value: status,
      onChange: (val) => setStatus(val || null),
    },
  ];


  async function handleAction(
    id: string,
    action: "mark_paid" | "mark_sent" | "delete",
  ) {
    setBusyId(id);
    try {
      if (action === "delete") {
        const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "Delete failed.");
        }
        toast.success("Invoice deleted.");
      } else {
        const res = await fetch(`/api/invoices/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "Action failed.");
        }
        toast.success(action === "mark_paid" ? "Marked as paid." : "Marked as sent.");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  const columns = buildColumns(busyId, handleAction);

  return (
    <DataTable
      data={initialInvoices}
      columns={columns}
      getRowKey={(inv) => inv.id}
      searchPlaceholder="Search invoices…"
      pagination={pagination}
      searchExtra={
        <>
          <FiltersPopover filters={filterGroups} />
          <DateRangeFilter key={status} />
        </>
      }
    />
  );
}
