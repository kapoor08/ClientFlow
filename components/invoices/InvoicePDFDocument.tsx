import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { InvoicePDFData } from "@/server/invoices";

type AppLogoSrc = { data: Buffer; format: "png" } | string;

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  primary: "#2563eb",
  primaryDark: "#1e40af",
  foreground: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  surface: "#f9fafb",
  billBg: "#eff4fa",
  success: "#16a34a",
  white: "#ffffff",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.foreground,
    backgroundColor: C.white,
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 60,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.primary,
  },
  logo: { width: 130, height: 34, objectFit: "contain" },
  orgBrand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.primary },

  // ── Invoice title + meta ────────────────────────────────────────────────────
  titleBlock: { alignItems: "flex-end", marginTop: 18, marginBottom: 30 },
  invoiceTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", color: C.primary, letterSpacing: 1 },
  metaTable: { marginTop: 10, width: 200 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  metaLabel: { fontSize: 9, color: C.muted },
  metaValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.foreground },

  // ── Bill from / to box ──────────────────────────────────────────────────────
  billBox: {
    flexDirection: "row",
    gap: 24,
    padding: 14,
    backgroundColor: C.billBg,
    borderRadius: 4,
    marginBottom: 26,
  },
  billBlock: { flex: 1 },
  billHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  billName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.foreground, marginBottom: 4 },
  billLine: { fontSize: 9, color: C.primary, marginBottom: 2 },

  // ── Optional title ──────────────────────────────────────────────────────────
  invoiceSubject: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.foreground,
    marginBottom: 14,
  },

  // ── Table ────────────────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  colDesc: { flex: 1, paddingRight: 8 },
  colQty: { width: 50, textAlign: "right" },
  colRate: { width: 70, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  thText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tdText: { fontSize: 9, color: C.foreground },
  tdAmount: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.foreground },
  tdMuted: { fontSize: 9, color: C.muted },

  // ── Totals ──────────────────────────────────────────────────────────────────
  totalsWrap: { alignItems: "flex-end", marginTop: 12, marginBottom: 28 },
  totalsInner: { width: 260 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  totalLabel: { fontSize: 9, color: C.muted },
  totalValue: { fontSize: 9, color: C.foreground },
  grandTotalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.primary,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  grandTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.white },
  grandTotalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.white },
  paidLabel: { fontSize: 9, color: C.success },
  paidValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.success },

  // ── Sections (plain) ────────────────────────────────────────────────────────
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.foreground,
    marginBottom: 4,
  },
  sectionText: { fontSize: 8.5, color: C.muted, lineHeight: 1.5 },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: "center",
  },
  footerText: { fontSize: 8, color: C.muted },
  pageNumber: { fontSize: 8, color: C.muted, marginTop: 2 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCents(cents: number | null, currency: string): string {
  if (cents == null) return "-";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });
}

function formatDate(d: Date | string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: string): string {
  if (status === "paid") return "Paid";
  if (status === "sent") return "Sent";
  if (status === "payment_failed") return "Payment Failed";
  if (status === "draft") return "Draft";
  return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function InvoicePDFDocument({
  data,
  appLogo,
}: {
  data: InvoicePDFData;
  appLogo?: AppLogoSrc;
}) {
  const { invoice, orgName, currencyCode } = data;
  const lineItems = invoice.lineItems ?? [];
  const subtotalCents = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
  const taxCents = 0;
  const totalCents = subtotalCents + taxCents;

  return (
    <Document title={`Invoice ${invoice.number ?? invoice.id.slice(0, 8)}`} author={orgName}>
      <Page size="A4" style={s.page}>
        {/* ── Brand bar (ClientFlow application logo) ─────────────────────── */}
        <View style={s.brandRow}>
          {appLogo ? (
            // react-pdf <Image> renders into PDF and has no alt prop / a11y
            // surface. The jsx-a11y/alt-text rule fires as a false positive.
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={appLogo} style={s.logo} />
          ) : (
            <Text style={s.orgBrand}>ClientFlow</Text>
          )}
        </View>

        {/* ── Invoice title + meta (right-aligned) ────────────────────────── */}
        <View style={s.titleBlock}>
          <Text style={s.invoiceTitle}>INVOICE</Text>
          <View style={s.metaTable}>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Invoice #</Text>
              <Text style={s.metaValue}>
                {invoice.number ?? invoice.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Date</Text>
              <Text style={s.metaValue}>{formatDate(invoice.createdAt)}</Text>
            </View>
            {invoice.dueAt && (
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>Due Date</Text>
                <Text style={s.metaValue}>{formatDate(invoice.dueAt)}</Text>
              </View>
            )}
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Status</Text>
              <Text style={s.metaValue}>{statusLabel(invoice.status)}</Text>
            </View>
          </View>
        </View>

        {/* ── Bill From / Bill To ─────────────────────────────────────────── */}
        <View style={s.billBox}>
          <View style={s.billBlock}>
            <Text style={s.billHeader}>Bill From</Text>
            <Text style={s.billName}>{orgName}</Text>
          </View>
          <View style={s.billBlock}>
            <Text style={s.billHeader}>Bill To</Text>
            {invoice.clientName && <Text style={s.billName}>{invoice.clientName}</Text>}
            {invoice.clientContactEmail && (
              <Text style={s.billLine}>{invoice.clientContactEmail}</Text>
            )}
            {invoice.clientContactPhone && (
              <Text style={s.billLine}>{invoice.clientContactPhone}</Text>
            )}
            {!invoice.clientName && !invoice.clientContactEmail && (
              <Text style={[s.billLine, { color: C.muted }]}>-</Text>
            )}
          </View>
        </View>

        {/* ── Invoice subject/title ───────────────────────────────────────── */}
        {invoice.title && <Text style={s.invoiceSubject}>{invoice.title}</Text>}

        {/* ── Line items table ────────────────────────────────────────────── */}
        <View style={s.tableHeader}>
          <Text style={[s.thText, s.colDesc]}>Description</Text>
          <Text style={[s.thText, s.colQty]}>Qty</Text>
          <Text style={[s.thText, s.colRate]}>Rate</Text>
          <Text style={[s.thText, s.colAmount]}>Amount</Text>
        </View>
        {lineItems.length === 0 ? (
          <View style={s.tableRow}>
            <Text style={[s.tdMuted, { flex: 1 }]}>No line items.</Text>
          </View>
        ) : (
          lineItems.map((li, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.tdText, s.colDesc]}>{li.description}</Text>
              <Text style={[s.tdMuted, s.colQty]}>{li.quantity}</Text>
              <Text style={[s.tdMuted, s.colRate]}>
                {formatCents(li.unitPriceCents, currencyCode)}
              </Text>
              <Text style={[s.tdAmount, s.colAmount]}>
                {formatCents(li.quantity * li.unitPriceCents, currencyCode)}
              </Text>
            </View>
          ))
        )}

        {/* ── Totals ──────────────────────────────────────────────────────── */}
        <View style={s.totalsWrap}>
          <View style={s.totalsInner}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{formatCents(subtotalCents, currencyCode)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Tax (0%)</Text>
              <Text style={s.totalValue}>{formatCents(taxCents, currencyCode)}</Text>
            </View>
            <View style={s.grandTotalBar}>
              <Text style={s.grandTotalLabel}>Total Due</Text>
              <Text style={s.grandTotalValue}>{formatCents(totalCents, currencyCode)}</Text>
            </View>
            {invoice.status === "paid" && invoice.amountPaidCents != null && (
              <View style={[s.totalRow, { marginTop: 4 }]}>
                <Text style={s.paidLabel}>Amount Paid</Text>
                <Text style={s.paidValue}>
                  {formatCents(invoice.amountPaidCents, currencyCode)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Payment Terms ────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Payment Terms</Text>
          <Text style={s.sectionText}>
            Payment is due within 14 days of the invoice date. Late payments may incur a 1.5%
            monthly finance charge.
          </Text>
          <Text style={s.sectionText}>
            Accepted methods: Credit/Debit Card, ACH Bank Transfer, Wire Transfer.
          </Text>
        </View>

        {/* ── Notes ───────────────────────────────────────────────────────── */}
        {invoice.notes && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Notes</Text>
            <Text style={s.sectionText}>{invoice.notes}</Text>
          </View>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {`Thank you for choosing ${orgName}. Questions? Contact us and we will be happy to help.`}
          </Text>
          <Text
            style={s.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
