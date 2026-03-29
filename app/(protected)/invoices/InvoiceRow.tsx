"use client";

import { useState } from "react";
import { MoreHorizontal, ExternalLink, CheckCircle2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { InvoiceListItem as InvoiceItem } from "@/core/invoices/entity";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground",
  sent: "bg-info/10 text-info",
  paid: "bg-success/10 text-success",
  payment_failed: "bg-destructive/10 text-destructive",
};

function formatCents(cents: number | null, currency: string | null): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  });
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Props = {
  invoice: InvoiceItem;
  onUpdated: () => void;
};

export function InvoiceRow({ invoice, onUpdated }: Props) {
  const [busy, setBusy] = useState(false);

  async function patchAction(action: "mark_paid" | "mark_sent") {
    setBusy(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Action failed.");
      }
      toast.success(action === "mark_paid" ? "Marked as paid." : "Marked as sent.");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete invoice ${invoice.number ?? invoice.id.slice(0, 8)}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Delete failed.");
      }
      toast.success("Invoice deleted.");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = invoice.status.replace("_", " ");
  const statusStyle = STATUS_STYLES[invoice.status] ?? "bg-secondary text-muted-foreground";
  const amount = formatCents(
    invoice.status === "paid" ? invoice.amountPaidCents : invoice.amountDueCents,
    invoice.currencyCode,
  );
  const dateLabel =
    invoice.status === "paid" ? formatDate(invoice.paidAt) : formatDate(invoice.dueAt);

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-foreground">
          {invoice.number ?? invoice.id.slice(0, 8).toUpperCase()}
        </div>
        {invoice.title && (
          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
            {invoice.title}
          </div>
        )}
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
        {invoice.clientName ?? "—"}
      </td>
      <td className="px-4 py-3 font-medium text-sm text-foreground">{amount}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${statusStyle}`}
        >
          {statusLabel}
        </span>
        {invoice.isManual && (
          <span className="ml-1.5 inline-flex rounded-pill px-1.5 py-0.5 text-xs bg-primary/10 text-primary font-medium">
            Manual
          </span>
        )}
      </td>
      <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
        {dateLabel}
      </td>
      <td className="px-4 py-3 text-right">
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
              <DropdownMenuItem onClick={() => patchAction("mark_sent")}>
                <Send className="mr-2 h-4 w-4" />
                Mark as Sent
              </DropdownMenuItem>
            )}
            {invoice.isManual && invoice.status !== "paid" && (
              <DropdownMenuItem onClick={() => patchAction("mark_paid")}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Paid
              </DropdownMenuItem>
            )}
            {invoice.isManual && invoice.status !== "paid" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
