/**
 * Pure invoice math, extracted so it can be unit-tested without pulling in the
 * `server-only` invoice module. Amounts are in integer cents.
 */
export type InvoiceLineItemAmount = {
  quantity: number;
  unitPriceCents: number;
};

/** Sum of quantity × unit price across all line items (integer cents). */
export function calculateInvoiceAmountDue(items: InvoiceLineItemAmount[]): number {
  return items.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
}
