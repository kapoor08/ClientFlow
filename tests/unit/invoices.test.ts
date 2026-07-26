import { describe, it, expect } from "vitest";
import { calculateInvoiceAmountDue } from "@/lib/billing/invoice-totals";

// Imports and exercises the REAL shipped invoice-total math (used by
// server/invoices.ts), not a local re-implementation.
describe("calculateInvoiceAmountDue (real implementation)", () => {
  it("sums quantity × unit price across line items", () => {
    expect(
      calculateInvoiceAmountDue([
        { quantity: 8, unitPriceCents: 15000 },
        { quantity: 4, unitPriceCents: 10000 },
        { quantity: 2, unitPriceCents: 8000 },
      ]),
    ).toBe(120000 + 40000 + 16000); // 176000
  });

  it("returns 0 for no line items", () => {
    expect(calculateInvoiceAmountDue([])).toBe(0);
  });

  it("handles a single line item", () => {
    expect(calculateInvoiceAmountDue([{ quantity: 1, unitPriceCents: 50000 }])).toBe(50000);
  });

  it("handles fractional quantities", () => {
    expect(calculateInvoiceAmountDue([{ quantity: 1.5, unitPriceCents: 10000 }])).toBe(15000);
  });
});
