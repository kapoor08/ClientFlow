import "server-only";

import { and, asc, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, clients } from "@/db/schema";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import type { InvoiceLineItem } from "@/db/schemas/billing";
import { writeAuditLog } from "@/lib/audit";
import {
  DEFAULT_PAGE_SIZE,
  buildPaginationMeta,
  paginationOffset,
  type PaginationMeta,
} from "@/lib/pagination";

export type { InvoiceLineItem };

export type InvoiceItem = {
  id: string;
  number: string | null;
  title: string | null;
  status: string;
  isManual: boolean;
  clientId: string | null;
  clientName: string | null;
  lineItems: InvoiceLineItem[] | null;
  notes: string | null;
  amountDueCents: number | null;
  amountPaidCents: number | null;
  currencyCode: string | null;
  invoiceUrl: string | null;
  dueAt: Date | null;
  paidAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
};

export type InvoiceFormValues = {
  clientId: string;
  title: string;
  number?: string;
  currencyCode?: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  dueAt?: string; // ISO date string
};

function calcAmountDue(items: InvoiceLineItem[]): number {
  return items.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
}

// ─── List ─────────────────────────────────────────────────────────────────────

const SORTABLE_INVOICE_COLUMNS = {
  number: invoices.number,
  amountDueCents: invoices.amountDueCents,
  createdAt: invoices.createdAt,
  dueAt: invoices.dueAt,
} as const;

type InvoiceSortKey = keyof typeof SORTABLE_INVOICE_COLUMNS;

function resolveInvoiceSort(sort: string | undefined, order: "asc" | "desc") {
  const col =
    SORTABLE_INVOICE_COLUMNS[
      (sort as InvoiceSortKey) in SORTABLE_INVOICE_COLUMNS
        ? (sort as InvoiceSortKey)
        : "createdAt"
    ];
  return order === "asc" ? asc(col) : desc(col);
}

export type ListInvoicesOptions = {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
  dateFrom?: Date;
  dateTo?: Date;
};

export async function listInvoicesForUser(
  userId: string,
  options: ListInvoicesOptions = {},
): Promise<{ invoices: InvoiceItem[]; pagination: PaginationMeta } | null> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) return null;

  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    query = "",
    status,
    sort,
    order = "desc",
    dateFrom,
    dateTo,
  } = options;

  const trimmedQuery = query.trim();

  const whereClause = and(
    eq(invoices.organizationId, ctx.organizationId),
    trimmedQuery
      ? or(
          ilike(invoices.number, `%${trimmedQuery}%`),
          ilike(invoices.title, `%${trimmedQuery}%`),
          ilike(clients.name, `%${trimmedQuery}%`),
        )
      : undefined,
    status ? eq(invoices.status, status) : undefined,
    dateFrom ? gte(invoices.createdAt, dateFrom) : undefined,
    dateTo ? lte(invoices.createdAt, dateTo) : undefined,
  );

  const [{ total }] = await db
    .select({ total: count() })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(whereClause);

  const rows = await db
    .select({
      id: invoices.id,
      number: invoices.number,
      title: invoices.title,
      status: invoices.status,
      isManual: invoices.isManual,
      clientId: invoices.clientId,
      clientName: clients.name,
      lineItems: invoices.lineItems,
      notes: invoices.notes,
      amountDueCents: invoices.amountDueCents,
      amountPaidCents: invoices.amountPaidCents,
      currencyCode: invoices.currencyCode,
      invoiceUrl: invoices.invoiceUrl,
      dueAt: invoices.dueAt,
      paidAt: invoices.paidAt,
      sentAt: invoices.sentAt,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(whereClause)
    .orderBy(resolveInvoiceSort(sort, order as "asc" | "desc"))
    .limit(pageSize)
    .offset(paginationOffset(page, pageSize));

  return {
    invoices: rows.map((r) => ({
      ...r,
      lineItems: (r.lineItems as InvoiceLineItem[] | null) ?? null,
    })),
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}

export async function getInvoiceForUser(
  userId: string,
  invoiceId: string,
): Promise<InvoiceItem | null> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) return null;

  const [row] = await db
    .select({
      id: invoices.id,
      number: invoices.number,
      title: invoices.title,
      status: invoices.status,
      isManual: invoices.isManual,
      clientId: invoices.clientId,
      clientName: clients.name,
      lineItems: invoices.lineItems,
      notes: invoices.notes,
      amountDueCents: invoices.amountDueCents,
      amountPaidCents: invoices.amountPaidCents,
      currencyCode: invoices.currencyCode,
      invoiceUrl: invoices.invoiceUrl,
      dueAt: invoices.dueAt,
      paidAt: invoices.paidAt,
      sentAt: invoices.sentAt,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(
      and(
        eq(invoices.id, invoiceId),
        eq(invoices.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    lineItems: (row.lineItems as InvoiceLineItem[] | null) ?? null,
  };
}

/**
 * Generates the next invoice number for the org: INV-0001, INV-0002, ...
 */
async function nextInvoiceNumber(organizationId: string): Promise<string> {
  const existing = await db
    .select({ number: invoices.number })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.isManual, true),
      ),
    );

  const used = new Set(existing.map((r) => r.number).filter(Boolean));
  let seq = used.size + 1;
  let candidate: string;
  do {
    candidate = `INV-${String(seq).padStart(4, "0")}`;
    seq++;
  } while (used.has(candidate));

  return candidate;
}

export async function createInvoiceForUser(
  userId: string,
  input: InvoiceFormValues,
): Promise<{ invoiceId: string }> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings) throw new Error("Only admins can create invoices.");

  const id = crypto.randomUUID();
  const number = input.number?.trim() || (await nextInvoiceNumber(ctx.organizationId));
  const amountDueCents = calcAmountDue(input.lineItems);

  await db.insert(invoices).values({
    id,
    organizationId: ctx.organizationId,
    clientId: input.clientId,
    number,
    title: input.title.trim(),
    isManual: true,
    lineItems: input.lineItems,
    notes: input.notes?.trim() || null,
    status: "draft",
    amountDueCents,
    amountPaidCents: 0,
    currencyCode: (input.currencyCode ?? ctx.currencyCode ?? "USD").toUpperCase(),
    dueAt: input.dueAt ? new Date(input.dueAt) : null,
  });

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: userId,
    action: "invoice.created",
    entityType: "invoice",
    entityId: id,
    metadata: { number, title: input.title.trim() },
  }).catch(console.error);

  return { invoiceId: id };
}

export async function updateInvoiceForUser(
  userId: string,
  invoiceId: string,
  input: Partial<InvoiceFormValues & { status: string }>,
): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings) throw new Error("Only admins can update invoices.");

  const [existing] = await db
    .select({ id: invoices.id, isManual: invoices.isManual })
    .from(invoices)
    .where(
      and(
        eq(invoices.id, invoiceId),
        eq(invoices.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!existing) throw new Error("Invoice not found.");
  if (!existing.isManual) throw new Error("Stripe invoices cannot be edited here.");

  const amountDueCents =
    input.lineItems ? calcAmountDue(input.lineItems) : undefined;

  await db
    .update(invoices)
    .set({
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.clientId !== undefined && { clientId: input.clientId }),
      ...(input.lineItems !== undefined && { lineItems: input.lineItems, amountDueCents }),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      ...(input.dueAt !== undefined && { dueAt: input.dueAt ? new Date(input.dueAt) : null }),
      ...(input.status !== undefined && { status: input.status }),
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));
}

export async function markInvoicePaidForUser(
  userId: string,
  invoiceId: string,
): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings) throw new Error("Only admins can mark invoices as paid.");

  const [existing] = await db
    .select({ id: invoices.id, amountDueCents: invoices.amountDueCents, isManual: invoices.isManual })
    .from(invoices)
    .where(
      and(
        eq(invoices.id, invoiceId),
        eq(invoices.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!existing) throw new Error("Invoice not found.");
  if (!existing.isManual) throw new Error("Stripe invoices cannot be manually marked as paid.");

  await db
    .update(invoices)
    .set({
      status: "paid",
      amountPaidCents: existing.amountDueCents ?? 0,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: userId,
    action: "invoice.paid",
    entityType: "invoice",
    entityId: invoiceId,
    metadata: {},
  }).catch(console.error);
}

export async function markInvoiceSentForUser(
  userId: string,
  invoiceId: string,
): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings) throw new Error("Only admins can send invoices.");

  const [existing] = await db
    .select({ id: invoices.id, isManual: invoices.isManual })
    .from(invoices)
    .where(
      and(
        eq(invoices.id, invoiceId),
        eq(invoices.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!existing) throw new Error("Invoice not found.");
  if (!existing.isManual) throw new Error("Only manual invoices can be sent from here.");

  await db
    .update(invoices)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));
}

export async function deleteInvoiceForUser(
  userId: string,
  invoiceId: string,
): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings) throw new Error("Only admins can delete invoices.");

  const [existing] = await db
    .select({ id: invoices.id, isManual: invoices.isManual, status: invoices.status })
    .from(invoices)
    .where(
      and(
        eq(invoices.id, invoiceId),
        eq(invoices.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!existing) throw new Error("Invoice not found.");
  if (!existing.isManual) throw new Error("Stripe invoices cannot be deleted.");
  if (existing.status === "paid") throw new Error("Paid invoices cannot be deleted.");

  await db.delete(invoices).where(eq(invoices.id, invoiceId));
}
