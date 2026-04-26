/**
 * India GST calculator + constants.
 *
 * For SaaS / IT services in India:
 *   - HSN/SAC code 998314 (IT consultancy & support services) at 18 %.
 *   - Same-state supply -> CGST 9 % + SGST 9 %.
 *   - Different-state supply -> IGST 18 %.
 *
 * "State" is the two-digit GST state code (e.g. "27" for Maharashtra). The
 * first two characters of a customer's GSTIN encode their state, and the
 * platform's state code comes from `PLATFORM_GST_STATE_CODE`.
 *
 * Amounts are integer cents-style (paise here, since GST is INR-only).
 */

export const GST_RATE_BASIS_POINTS = 1_800; // 18.00 %
export const GST_HALF_RATE_BASIS_POINTS = 900; // 9.00 %  (CGST or SGST)
export const SAAS_HSN_SAC_CODE = "998314";

export type GstRegime = "intra_state" | "inter_state" | "exempt";

export type GstBreakdown = {
  regime: GstRegime;
  /** Subtotal in paise (tax-exclusive). */
  subtotalCents: number;
  cgstCents: number;
  sgstCents: number;
  igstCents: number;
  totalTaxCents: number;
  /** Subtotal + total tax. */
  grandTotalCents: number;
  hsnSacCode: string;
};

/**
 * GSTIN format: `<state-code:2><pan:10><entity:1><Z:1><checksum:1>`. We don't
 * verify the checksum here - just shape - because regex validation is enough
 * to gate user input; downstream filings re-validate.
 */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;

export function isValidGstin(gstin: string): boolean {
  return GSTIN_REGEX.test(gstin);
}

/**
 * Returns the two-digit GST state code embedded in a GSTIN. Returns null if
 * the input is malformed.
 */
export function gstStateCodeFromGstin(gstin: string): string | null {
  if (!isValidGstin(gstin)) return null;
  return gstin.slice(0, 2);
}

/**
 * Computes the GST split for a tax-EXCLUSIVE subtotal.
 *
 * - sellerStateCode === buyerStateCode (and both present) -> intra-state
 *   (CGST + SGST, each at half the rate).
 * - Different states -> inter-state (IGST at full rate).
 * - Buyer state unknown / B2C unregistered -> default to inter-state. This
 *   is the conservative choice: the tax amount is the same; only the row
 *   labels differ. Treating an unknown buyer as intra-state would risk
 *   under-collecting CGST/SGST allocation when filing.
 *
 * Pass `exempt: true` to skip tax entirely (e.g. for export-of-service or
 * SEZ supplies).
 */
export function calculateGst(opts: {
  subtotalCents: number;
  sellerStateCode: string;
  buyerStateCode?: string | null;
  exempt?: boolean;
}): GstBreakdown {
  const { subtotalCents, sellerStateCode, buyerStateCode, exempt } = opts;

  if (exempt) {
    return {
      regime: "exempt",
      subtotalCents,
      cgstCents: 0,
      sgstCents: 0,
      igstCents: 0,
      totalTaxCents: 0,
      grandTotalCents: subtotalCents,
      hsnSacCode: SAAS_HSN_SAC_CODE,
    };
  }

  const isIntraState = !!buyerStateCode && !!sellerStateCode && buyerStateCode === sellerStateCode;

  if (isIntraState) {
    // Round each half independently then settle the difference into SGST so
    // the two halves always sum to the full IGST-equivalent.
    const half = Math.round((subtotalCents * GST_HALF_RATE_BASIS_POINTS) / 10_000);
    const cgstCents = half;
    const fullTax = Math.round((subtotalCents * GST_RATE_BASIS_POINTS) / 10_000);
    const sgstCents = fullTax - cgstCents;
    const totalTaxCents = cgstCents + sgstCents;
    return {
      regime: "intra_state",
      subtotalCents,
      cgstCents,
      sgstCents,
      igstCents: 0,
      totalTaxCents,
      grandTotalCents: subtotalCents + totalTaxCents,
      hsnSacCode: SAAS_HSN_SAC_CODE,
    };
  }

  const igstCents = Math.round((subtotalCents * GST_RATE_BASIS_POINTS) / 10_000);
  return {
    regime: "inter_state",
    subtotalCents,
    cgstCents: 0,
    sgstCents: 0,
    igstCents,
    totalTaxCents: igstCents,
    grandTotalCents: subtotalCents + igstCents,
    hsnSacCode: SAAS_HSN_SAC_CODE,
  };
}

/**
 * Reverses the calculation: given a tax-INCLUSIVE total (the typical case
 * with Stripe today, where the price the customer pays already includes
 * GST), back out subtotal + tax components. Useful when we record an invoice
 * after a Stripe charge and the customer's GSTIN is on file.
 */
export function calculateGstFromGross(opts: {
  grossCents: number;
  sellerStateCode: string;
  buyerStateCode?: string | null;
  exempt?: boolean;
}): GstBreakdown {
  if (opts.exempt) {
    return calculateGst({ ...opts, subtotalCents: opts.grossCents });
  }
  // gross = subtotal * (1 + rate). subtotal = gross / (1 + rate).
  // rate is GST_RATE_BASIS_POINTS / 10_000.
  const subtotalCents = Math.round((opts.grossCents * 10_000) / (10_000 + GST_RATE_BASIS_POINTS));
  return calculateGst({
    subtotalCents,
    sellerStateCode: opts.sellerStateCode,
    buyerStateCode: opts.buyerStateCode,
  });
}
