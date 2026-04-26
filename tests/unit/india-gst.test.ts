import { describe, it, expect } from "vitest";
import {
  calculateGst,
  calculateGstFromGross,
  gstStateCodeFromGstin,
  isValidGstin,
  SAAS_HSN_SAC_CODE,
} from "@/lib/billing/india-gst";

describe("isValidGstin", () => {
  it("accepts a well-formed GSTIN", () => {
    expect(isValidGstin("27AAACR5055K1Z5")).toBe(true);
  });

  it("rejects too-short input", () => {
    expect(isValidGstin("27AAACR5055K1Z")).toBe(false);
  });

  it("rejects lowercase letters", () => {
    expect(isValidGstin("27aaacr5055k1z5")).toBe(false);
  });
});

describe("gstStateCodeFromGstin", () => {
  it("returns the two-digit state code for a valid GSTIN", () => {
    expect(gstStateCodeFromGstin("27AAACR5055K1Z5")).toBe("27");
  });

  it("returns null for an invalid GSTIN", () => {
    expect(gstStateCodeFromGstin("not-a-gstin")).toBe(null);
  });
});

describe("calculateGst (tax-exclusive subtotal)", () => {
  it("intra-state supply splits into CGST + SGST at 9% each", () => {
    const r = calculateGst({
      subtotalCents: 100_000, // ₹1000.00
      sellerStateCode: "27",
      buyerStateCode: "27",
    });
    expect(r.regime).toBe("intra_state");
    expect(r.cgstCents).toBe(9_000);
    expect(r.sgstCents).toBe(9_000);
    expect(r.igstCents).toBe(0);
    expect(r.totalTaxCents).toBe(18_000);
    expect(r.grandTotalCents).toBe(118_000);
    expect(r.hsnSacCode).toBe(SAAS_HSN_SAC_CODE);
  });

  it("inter-state supply applies IGST at 18%", () => {
    const r = calculateGst({
      subtotalCents: 100_000,
      sellerStateCode: "27",
      buyerStateCode: "06",
    });
    expect(r.regime).toBe("inter_state");
    expect(r.cgstCents).toBe(0);
    expect(r.sgstCents).toBe(0);
    expect(r.igstCents).toBe(18_000);
    expect(r.totalTaxCents).toBe(18_000);
    expect(r.grandTotalCents).toBe(118_000);
  });

  it("missing buyer state defaults to inter-state (conservative)", () => {
    const r = calculateGst({
      subtotalCents: 100_000,
      sellerStateCode: "27",
      buyerStateCode: null,
    });
    expect(r.regime).toBe("inter_state");
    expect(r.igstCents).toBe(18_000);
  });

  it("exempt supply zeroes all tax components", () => {
    const r = calculateGst({
      subtotalCents: 100_000,
      sellerStateCode: "27",
      buyerStateCode: "06",
      exempt: true,
    });
    expect(r.regime).toBe("exempt");
    expect(r.totalTaxCents).toBe(0);
    expect(r.grandTotalCents).toBe(100_000);
  });

  it("intra-state CGST + SGST always sum to the full IGST equivalent (rounding-safe)", () => {
    // Picks an awkward number to exercise rounding.
    const subtotal = 33_337;
    const r = calculateGst({
      subtotalCents: subtotal,
      sellerStateCode: "27",
      buyerStateCode: "27",
    });
    const inter = calculateGst({
      subtotalCents: subtotal,
      sellerStateCode: "27",
      buyerStateCode: "06",
    });
    expect(r.cgstCents + r.sgstCents).toBe(inter.igstCents);
  });
});

describe("calculateGstFromGross (tax-inclusive)", () => {
  it("backs out the subtotal and tax from a tax-inclusive gross", () => {
    // ₹1180 gross with 18% GST should imply ₹1000 subtotal + ₹180 tax.
    const r = calculateGstFromGross({
      grossCents: 118_000,
      sellerStateCode: "27",
      buyerStateCode: "06",
    });
    expect(r.subtotalCents).toBe(100_000);
    expect(r.totalTaxCents).toBe(18_000);
    expect(r.grandTotalCents).toBe(118_000);
  });

  it("exempt grossed-up amount returns identity (no tax extraction)", () => {
    const r = calculateGstFromGross({
      grossCents: 118_000,
      sellerStateCode: "27",
      buyerStateCode: "06",
      exempt: true,
    });
    expect(r.subtotalCents).toBe(118_000);
    expect(r.totalTaxCents).toBe(0);
  });
});
