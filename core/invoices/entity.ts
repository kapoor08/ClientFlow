import { BILLING_INVOICE_STATUS_OPTIONS } from "@/constants/billing";

export type InvoiceListItem = {
  id: string;
  number: string | null;
  title: string | null;
  status: string;
  isManual: boolean;
  clientId: string | null;
  clientName: string | null;
  amountDueCents: number | null;
  amountPaidCents: number | null;
  currencyCode: string | null;
  invoiceUrl: string | null;
  dueAt: string | null;
  paidAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

// ─── Manual invoice display constants ─────────────────────────────────────────
// Stripe-flavored status maps live in the client-portal/invoices page since
// they use a different vocabulary (open/uncollectible/void).

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  payment_failed: "Payment Failed",
};

export const INVOICE_STATUS_STYLES: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground",
  sent: "bg-info/10 text-info",
  paid: "bg-success/10 text-success",
  payment_failed: "bg-destructive/10 text-destructive",
};

export const INVOICE_STATUS_OPTIONS = Object.entries(INVOICE_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export { BILLING_INVOICE_STATUS_OPTIONS };
