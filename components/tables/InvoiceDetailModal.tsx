"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { InvoiceListItem } from "@/core/invoices/entity";
import { INVOICE_STATUS_STYLES as STATUS_STYLES } from "@/core/invoices/entity";
import { formatDate } from "@/utils/date";

type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

type FullInvoice = InvoiceListItem & {
  lineItems: InvoiceLineItem[] | null;
  notes: string | null;
};

function formatCents(cents: number, currency: string | null) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  });
}

type Props = {
  invoiceId: string | null;
  onClose: () => void;
};

export function InvoiceDetailModal({ invoiceId, onClose }: Props) {
  const [invoice, setInvoice] = useState<FullInvoice | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!invoiceId) {
      setInvoice(null);
      return;
    }
    setLoading(true);
    fetch(`/api/invoices/${invoiceId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setInvoice(data as FullInvoice))
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const lineItems = invoice?.lineItems ?? [];
  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitPriceCents,
    0,
  );

  return (
    <Dialog open={!!invoiceId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {loading || !invoice
              ? "Invoice Details"
              : `${invoice.number ?? "Invoice"} - ${invoice.title ?? ""}`}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 pt-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="mt-4 h-24 w-full" />
          </div>
        ) : !invoice ? (
          <p className="text-sm text-muted-foreground">Failed to load invoice.</p>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span
                className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[invoice.status] ?? "bg-secondary text-muted-foreground"}`}
              >
                {invoice.status.replace("_", " ")}
              </span>
              {invoice.isManual && (
                <span className="inline-flex rounded-pill bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Manual
                </span>
              )}
              {invoice.clientName && (
                <span className="text-muted-foreground">{invoice.clientName}</span>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-xs">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Due</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {formatDate(invoice.dueAt)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Paid</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {formatDate(invoice.paidAt)}
                </p>
              </div>
            </div>

            {/* Line items */}
            {lineItems.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-border bg-secondary/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Description</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Amount</span>
                </div>
                {lineItems.map((li, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2.5 text-sm ${i < lineItems.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <span className="text-foreground">{li.description}</span>
                    <span className="text-right text-muted-foreground">{li.quantity}</span>
                    <span className="text-right font-medium text-foreground">
                      {formatCents(li.quantity * li.unitPriceCents, invoice.currencyCode)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-3 py-2.5">
                  <span className="text-xs font-semibold text-muted-foreground">Total</span>
                  <span className="text-sm font-bold text-foreground">
                    {formatCents(subtotal, invoice.currencyCode)}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2.5">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <p className="text-xs text-foreground">{invoice.notes}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
