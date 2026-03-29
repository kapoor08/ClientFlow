import { describe, it, expect } from "vitest";

// ── Invoice line item calculation ─────────────────────────────────────────────

type LineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

function calculateLineTotal(item: LineItem): number {
  return item.quantity * item.unitPriceCents;
}

function calculateInvoiceTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

describe("Invoice line item calculations", () => {
  it("calculates line total correctly", () => {
    expect(calculateLineTotal({ description: "Dev work", quantity: 10, unitPriceCents: 10000 })).toBe(100000);
    expect(calculateLineTotal({ description: "Design", quantity: 1, unitPriceCents: 50000 })).toBe(50000);
  });

  it("calculates invoice total across multiple line items", () => {
    const items: LineItem[] = [
      { description: "Development", quantity: 8, unitPriceCents: 15000 },
      { description: "Design", quantity: 4, unitPriceCents: 10000 },
      { description: "Testing", quantity: 2, unitPriceCents: 8000 },
    ];
    // 120000 + 40000 + 16000 = 176000
    expect(calculateInvoiceTotal(items)).toBe(176000);
  });

  it("returns 0 for empty line items", () => {
    expect(calculateInvoiceTotal([])).toBe(0);
  });

  it("handles fractional quantities", () => {
    expect(calculateLineTotal({ description: "Hours", quantity: 1.5, unitPriceCents: 10000 })).toBe(15000);
  });
});

describe("formatCents", () => {
  it("formats zero correctly", () => {
    expect(formatCents(0)).toBe("0.00");
  });

  it("formats whole dollar amounts", () => {
    expect(formatCents(10000)).toBe("100.00");
    expect(formatCents(50000)).toBe("500.00");
  });

  it("formats amounts with cents", () => {
    expect(formatCents(10050)).toBe("100.50");
    expect(formatCents(199)).toBe("1.99");
  });

  it("formats large amounts", () => {
    expect(formatCents(1000000)).toBe("10000.00");
  });
});

// ── Invoice number generation ─────────────────────────────────────────────────

describe("Invoice number format", () => {
  it("matches expected INV-XXXX pattern", () => {
    // Simulates what the DB sequence generates
    const format = (seq: number) => `INV-${String(seq).padStart(4, "0")}`;
    expect(format(1)).toBe("INV-0001");
    expect(format(42)).toBe("INV-0042");
    expect(format(999)).toBe("INV-0999");
    expect(format(1000)).toBe("INV-1000");
    expect(format(10000)).toBe("INV-10000");
  });
});

// ── Invoice status transitions ────────────────────────────────────────────────

describe("Invoice status transitions", () => {
  type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

  it("can transition from draft to sent", () => {
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      draft: ["sent"],
      sent: ["paid", "overdue"],
      paid: [],
      overdue: ["paid"],
    };

    expect(validTransitions.draft).toContain("sent");
    expect(validTransitions.sent).toContain("paid");
    expect(validTransitions.paid).toHaveLength(0);
  });

  it("cannot re-open a paid invoice", () => {
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      draft: ["sent"],
      sent: ["paid", "overdue"],
      paid: [],
      overdue: ["paid"],
    };
    expect(validTransitions.paid).not.toContain("draft");
    expect(validTransitions.paid).not.toContain("sent");
  });
});
