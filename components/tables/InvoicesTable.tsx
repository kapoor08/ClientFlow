"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  CheckCircle2,
  Send,
  Trash2,
  Eye,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { parseAsString, useQueryState } from "nuqs";
import { formatDate } from "@/utils/date";
import {
  DataTable,
  DateRangeFilter,
  FiltersPopover,
  type ColumnDef,
  type FilterGroupConfig,
} from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TipButton, TipLink, TooltipProvider } from "@/components/data-table/RowActions";
import { InvoiceDetailModal } from "./InvoiceDetailModal";
import type { InvoiceListItem } from "@/core/invoices/entity";
import {
  INVOICE_STATUS_STYLES as STATUS_STYLES,
  INVOICE_STATUS_OPTIONS as STATUS_OPTIONS,
} from "@/core/invoices/entity";
import type { PaginationMeta } from "@/utils/pagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCents(cents: number | null, currency: string | null): string {
  if (cents == null) return "-";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  });
}

// ─── Actions cell ─────────────────────────────────────────────────────────────

function InvoiceActionsCell({
  invoice,
  onAction,
  onViewDetails,
  busyId,
}: {
  invoice: InvoiceListItem;
  onAction: (id: string, action: "mark_paid" | "mark_sent" | "delete") => void;
  onViewDetails: (id: string) => void;
  busyId: string | null;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const busy = busyId === invoice.id;

  const canMarkSent = invoice.isManual && invoice.status === "draft";
  const canMarkPaid = invoice.isManual && invoice.status !== "paid";
  const canDelete = invoice.isManual && invoice.status !== "paid";

  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          <TipButton label="View details" onClick={() => onViewDetails(invoice.id)} disabled={busy}>
            <Eye size={14} />
          </TipButton>

          <TipLink
            href={`/api/invoices/${invoice.id}/pdf?download=1`}
            label="Download PDF"
            download="true"
          >
            <Download size={14} />
          </TipLink>

          {invoice.invoiceUrl && (
            <TipLink
              href={invoice.invoiceUrl}
              label="Open in Stripe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} />
            </TipLink>
          )}

          {canMarkSent && (
            <TipButton
              label="Mark as Sent"
              onClick={() => onAction(invoice.id, "mark_sent")}
              disabled={busy}
            >
              <Send size={14} />
            </TipButton>
          )}

          {canMarkPaid && (
            <TipButton
              label="Mark as Paid"
              onClick={() => onAction(invoice.id, "mark_paid")}
              disabled={busy}
              variant="success"
            >
              <CheckCircle2 size={14} />
            </TipButton>
          )}

          {canDelete && (
            <TipButton
              label="Delete"
              onClick={() => setDeleteOpen(true)}
              disabled={busy}
              variant="danger"
            >
              <Trash2 size={14} />
            </TipButton>
          )}
        </div>
      </TooltipProvider>

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
  onViewDetails: (id: string) => void,
): ColumnDef<InvoiceListItem>[] {
  return [
    {
      key: "actions",
      header: "Actions",
      cell: (inv) => (
        <InvoiceActionsCell
          invoice={inv}
          onAction={onAction}
          onViewDetails={onViewDetails}
          busyId={busyId}
        />
      ),
    },
    {
      key: "number",
      header: "Invoice",
      sortable: true,
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
        <span className="text-sm text-muted-foreground">{inv.clientName ?? "-"}</span>
      ),
    },
    {
      key: "amountDueCents",
      header: "Amount",
      sortable: true,
      cell: (inv) => (
        <div>
          <span className="text-sm font-medium text-foreground">
            {formatCents(inv.amountDueCents, inv.currencyCode)}
          </span>
          {inv.status === "paid" && inv.amountPaidCents !== inv.amountDueCents && (
            <p className="text-[10px] text-success">
              Paid: {formatCents(inv.amountPaidCents, inv.currencyCode)}
            </p>
          )}
        </div>
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
      header: "Due Date",
      sortable: true,
      hideOnMobile: true,
      cell: (inv) => (
        <span className="text-xs text-muted-foreground">{formatDate(inv.dueAt)}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      hideOnTablet: true,
      cell: (inv) => (
        <span className="text-xs text-muted-foreground">{formatDate(inv.createdAt)}</span>
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
  const [detailId, setDetailId] = useState<string | null>(null);

  const [status, setStatus] = useQueryState(
    "status",
    parseAsString
      .withDefault("")
      .withOptions({ shallow: false, startTransition, clearOnDefault: true }),
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

  const columns = buildColumns(busyId, handleAction, setDetailId);

  return (
    <>
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

      <InvoiceDetailModal
        invoiceId={detailId}
        onClose={() => setDetailId(null)}
      />
    </>
  );
}
