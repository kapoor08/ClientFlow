import { RowActions } from "@/components/data-table";
import type { BillingInvoiceItem } from "@/core/billing/entity";
import { formatPrice, formatDate, getStatusStyle } from "@/core/billing/entity";

// ─── InvoiceRow ───────────────────────────────────────────────────────────────

function InvoiceRow({ invoice }: { invoice: BillingInvoiceItem }) {
  const amount =
    invoice.status === "paid"
      ? formatPrice(invoice.amountPaidCents, invoice.currencyCode ?? "USD")
      : formatPrice(invoice.amountDueCents, invoice.currencyCode ?? "USD");

  const date =
    invoice.status === "paid"
      ? formatDate(invoice.paidAt)
      : formatDate(invoice.dueAt);

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
        {invoice.id.slice(0, 8).toUpperCase()}
      </td>
      <td className="px-4 py-3 font-medium text-foreground">{amount}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${getStatusStyle(invoice.status)}`}
        >
          {invoice.status}
        </span>
      </td>
      <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
        {date}
      </td>
      <td className="px-4 py-3 text-right">
        <RowActions openHref={invoice.invoiceUrl ?? undefined} />
      </td>
    </tr>
  );
}

// ─── InvoicesList ─────────────────────────────────────────────────────────────

export function InvoicesList({ invoices }: { invoices: BillingInvoiceItem[] }) {
  return (
    <>
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
        Invoice History
      </h2>
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Date
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!invoices.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No invoices yet. Your billing history will appear here after
                  your first billing cycle.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <InvoiceRow key={inv.id} invoice={inv} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
