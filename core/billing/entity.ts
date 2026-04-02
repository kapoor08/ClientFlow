import type { PaginationMeta } from "@/lib/pagination";

export type BillingInvoiceItem = {
  id: string;
  number: string | null;
  externalInvoiceId: string | null;
  status: string;
  amountDueCents: number | null;
  amountPaidCents: number | null;
  currencyCode: string | null;
  invoiceUrl: string | null;
  invoicePdfUrl: string | null;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type BillingUsageStat = {
  used: number;
  limit: number | null;
};

export type BillingSubscriptionInfo = {
  planName: string;
  planCode: string;
  status: string;
  billingCycle: string | null;
  currentPeriodEnd: string | null;
  monthlyPriceCents: number | null;
  yearlyPriceCents: number | null;
  cancelAtPeriodEnd: boolean;
};

export type BillingContext = {
  subscription: BillingSubscriptionInfo | null;
  usage: {
    members: BillingUsageStat;
    projects: BillingUsageStat;
    clients: BillingUsageStat;
    tasksThisMonth: BillingUsageStat;
    commentsThisMonth: BillingUsageStat;
    fileUploadsThisMonth: BillingUsageStat;
  };
  invoices: BillingInvoiceItem[];
  invoicePagination: PaginationMeta;
};

// ─── Formatting helpers ────────────────────────────────────────────────────────

export function formatPrice(
  cents: number | null,
  currencyCode = "USD",
): string {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatUsage(used: number, limit: number | null): string {
  if (limit === null) return `${used} / ∞`;
  return `${used} / ${limit}`;
}

export function usagePercent(used: number, limit: number | null): number {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success",
  trialing: "bg-brand-100 text-primary",
  past_due: "bg-danger/10 text-danger",
  canceled: "bg-secondary text-muted-foreground",
  paid: "bg-success/10 text-success",
  open: "bg-warning/10 text-warning",
  void: "bg-secondary text-muted-foreground",
  uncollectible: "bg-danger/10 text-danger",
};

export function getStatusStyle(status: string): string {
  return STATUS_STYLES[status] ?? "bg-secondary text-muted-foreground";
}
