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
