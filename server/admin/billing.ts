import "server-only";

import { addDays } from "date-fns";
import { and, count, desc, eq, gte, ilike, isNotNull, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  invoices,
  organizations,
  plans,
  subscriptions,
  organizationCurrentSubscriptions,
  platformAdminActions,
} from "@/db/schema";
import { stripe, isStripeConfigured, withStripeBreaker } from "@/server/third-party/stripe";
import { buildPaginationMeta, paginationOffset, type PaginatedResult } from "@/utils/pagination";

type ListAdminSubscriptionsOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
  status?: string;
  plan?: string;
  cycle?: string;
};

export type AdminSubscriptionRow = {
  id: string;
  organizationId: string;
  status: string;
  billingCycle: string | null;
  currentPeriodEnd: Date | null;
  monthlyPriceCents: number | null;
  yearlyPriceCents: number | null;
  stripeCustomerId: string | null;
  planCode: string;
  planName: string;
  orgName: string;
};

export async function listAdminSubscriptions(
  opts: ListAdminSubscriptionsOptions = {},
): Promise<PaginatedResult<AdminSubscriptionRow>> {
  const { query, page = 1, pageSize = 20, status, plan, cycle } = opts;

  // ── WHERE conditions ────────────────────────────────────────────────────────
  const conditions = [];

  if (query?.trim()) {
    conditions.push(ilike(organizations.name, `%${query.trim()}%`));
  }
  if (status) conditions.push(eq(subscriptions.status, status));
  if (plan) conditions.push(eq(plans.code, plan));
  if (cycle) conditions.push(eq(subscriptions.billingCycle, cycle));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Base join for all queries
  const baseFrom = db
    .select({ total: count(subscriptions.id) })
    .from(organizationCurrentSubscriptions)
    .innerJoin(subscriptions, eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id))
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .innerJoin(
      organizations,
      eq(organizationCurrentSubscriptions.organizationId, organizations.id),
    );

  const [{ total }] = await baseFrom.where(where);
  const pagination = buildPaginationMeta(total, page, pageSize);

  const rows = await db
    .select({
      id: subscriptions.id,
      organizationId: organizationCurrentSubscriptions.organizationId,
      status: subscriptions.status,
      billingCycle: subscriptions.billingCycle,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      monthlyPriceCents: plans.monthlyPriceCents,
      yearlyPriceCents: plans.yearlyPriceCents,
      stripeCustomerId: subscriptions.stripeCustomerId,
      planCode: plans.code,
      planName: plans.name,
      orgName: organizations.name,
    })
    .from(organizationCurrentSubscriptions)
    .innerJoin(subscriptions, eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id))
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .innerJoin(organizations, eq(organizationCurrentSubscriptions.organizationId, organizations.id))
    .where(where)
    .orderBy(desc(subscriptions.updatedAt))
    .limit(pagination.pageSize)
    .offset(paginationOffset(pagination.page, pagination.pageSize));

  return { data: rows, pagination };
}

export async function getAdminBillingStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeRows, trialingRows, canceledThisMonth, mrrRows] = await Promise.all([
    db
      .select({ value: count(subscriptions.id) })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),
    db
      .select({ value: count(subscriptions.id) })
      .from(subscriptions)
      .where(eq(subscriptions.status, "trialing")),
    db
      .select({ value: count(subscriptions.id) })
      .from(subscriptions)
      .where(and(eq(subscriptions.status, "canceled"), gte(subscriptions.updatedAt, startOfMonth))),
    db
      .select({
        status: subscriptions.status,
        billingCycle: subscriptions.billingCycle,
        monthlyPriceCents: plans.monthlyPriceCents,
        yearlyPriceCents: plans.yearlyPriceCents,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.status, "active")),
  ]);

  const mrrCents = mrrRows.reduce((sum, s) => {
    if (s.billingCycle === "yearly") return sum + Math.round((s.yearlyPriceCents ?? 0) / 12);
    return sum + (s.monthlyPriceCents ?? 0);
  }, 0);

  return {
    activeCount: activeRows[0]?.value ?? 0,
    trialingCount: trialingRows[0]?.value ?? 0,
    canceledThisMonth: canceledThisMonth[0]?.value ?? 0,
    mrrCents,
    arrCents: mrrCents * 12,
  };
}

export async function getSubscriptionById(subscriptionId: string) {
  const [row] = await db
    .select({
      id: subscriptions.id,
      organizationId: subscriptions.organizationId,
      planId: subscriptions.planId,
      status: subscriptions.status,
      billingCycle: subscriptions.billingCycle,
      trialEndsAt: subscriptions.trialEndsAt,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      planCode: plans.code,
      planName: plans.name,
      orgName: organizations.name,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);
  return row ?? null;
}

async function logPlatformAdminAction(opts: {
  adminUserId: string;
  action: string;
  subscriptionId: string;
  afterSnapshot: Record<string, unknown>;
}) {
  const [sub] = await db
    .select({ organizationId: subscriptions.organizationId })
    .from(subscriptions)
    .where(eq(subscriptions.id, opts.subscriptionId))
    .limit(1);

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: opts.adminUserId,
    action: opts.action,
    entityType: "subscription",
    entityId: opts.subscriptionId,
    organizationId: sub?.organizationId ?? null,
    afterSnapshot: opts.afterSnapshot,
  });
}

export async function extendTrial(subscriptionId: string, days: number, adminUserId: string) {
  const [sub] = await db
    .select({ trialEndsAt: subscriptions.trialEndsAt })
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);

  if (!sub) throw new Error("Subscription not found.");

  const baseDate = sub.trialEndsAt && sub.trialEndsAt > new Date() ? sub.trialEndsAt : new Date();
  const newTrialEnd = addDays(baseDate, days);

  await db
    .update(subscriptions)
    .set({ trialEndsAt: newTrialEnd, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));

  await logPlatformAdminAction({
    adminUserId,
    action: "extend_trial",
    subscriptionId,
    afterSnapshot: { days, newTrialEnd: newTrialEnd.toISOString() },
  });

  return newTrialEnd;
}

export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPlanId: string,
  adminUserId: string,
) {
  await db
    .update(subscriptions)
    .set({ planId: newPlanId, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));

  await logPlatformAdminAction({
    adminUserId,
    action: "change_subscription_plan",
    subscriptionId,
    afterSnapshot: { newPlanId },
  });
}

export async function setCancelAtPeriodEnd(
  subscriptionId: string,
  value: boolean,
  adminUserId: string,
) {
  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: value, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));

  await logPlatformAdminAction({
    adminUserId,
    action: value ? "set_cancel_at_period_end" : "resume_subscription",
    subscriptionId,
    afterSnapshot: { cancelAtPeriodEnd: value },
  });
}

// ─── Refunds ─────────────────────────────────────────────────────────────────

export type RefundableInvoiceRow = {
  id: string;
  externalInvoiceId: string | null;
  status: string;
  amountPaidCents: number;
  currencyCode: string | null;
  paidAt: Date | null;
  invoiceUrl: string | null;
};

export async function listRefundableInvoicesForSubscription(
  subscriptionId: string,
): Promise<RefundableInvoiceRow[]> {
  const rows = await db
    .select({
      id: invoices.id,
      externalInvoiceId: invoices.externalInvoiceId,
      status: invoices.status,
      amountPaidCents: invoices.amountPaidCents,
      currencyCode: invoices.currencyCode,
      paidAt: invoices.paidAt,
      invoiceUrl: invoices.invoiceUrl,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.subscriptionId, subscriptionId),
        eq(invoices.status, "paid"),
        isNotNull(invoices.externalInvoiceId),
      ),
    )
    .orderBy(desc(invoices.paidAt))
    .limit(10);

  return rows.map((r) => ({
    ...r,
    amountPaidCents: r.amountPaidCents ?? 0,
  }));
}

export type RefundResult = {
  refundId: string;
  amountCents: number;
  status: string;
};

export async function refundStripeInvoice(
  invoiceId: string,
  adminUserId: string,
  opts: { amountCents?: number; reason?: string } = {},
): Promise<RefundResult> {
  if (!isStripeConfigured) {
    throw new Error("Stripe is not configured - cannot process refunds.");
  }

  const [invoice] = await db
    .select({
      id: invoices.id,
      externalInvoiceId: invoices.externalInvoiceId,
      status: invoices.status,
      amountPaidCents: invoices.amountPaidCents,
      organizationId: invoices.organizationId,
      subscriptionId: invoices.subscriptionId,
    })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!invoice) throw new Error("Invoice not found.");
  if (!invoice.externalInvoiceId) {
    throw new Error("Invoice is not synced with Stripe - nothing to refund.");
  }
  if (invoice.status !== "paid") {
    throw new Error(`Cannot refund an invoice in status "${invoice.status}".`);
  }

  // Fetch the Stripe invoice to get its payment_intent
  const stripeInvoice = await withStripeBreaker("invoices.retrieve", () =>
    stripe.invoices.retrieve(invoice.externalInvoiceId!),
  );
  const inv = stripeInvoice as unknown as Record<string, unknown>;
  const paymentIntentId =
    typeof inv.payment_intent === "string" ? (inv.payment_intent as string) : null;
  const chargeId = typeof inv.charge === "string" ? (inv.charge as string) : null;

  if (!paymentIntentId && !chargeId) {
    throw new Error("Stripe invoice has no payment to refund.");
  }

  const reasonEnum =
    opts.reason === "duplicate" ||
    opts.reason === "fraudulent" ||
    opts.reason === "requested_by_customer"
      ? opts.reason
      : "requested_by_customer";

  const refund = await withStripeBreaker("refunds.create", () =>
    stripe.refunds.create({
      ...(paymentIntentId ? { payment_intent: paymentIntentId } : { charge: chargeId! }),
      ...(opts.amountCents != null && opts.amountCents > 0 ? { amount: opts.amountCents } : {}),
      reason: reasonEnum,
      metadata: {
        organizationId: invoice.organizationId,
        internalInvoiceId: invoice.id,
        adminUserId,
      },
    }),
  );

  const refundedCents =
    typeof refund.amount === "number"
      ? refund.amount
      : (opts.amountCents ?? invoice.amountPaidCents ?? 0);
  const isFull = refundedCents >= (invoice.amountPaidCents ?? 0);

  await db
    .update(invoices)
    .set({
      status: isFull ? "refunded" : "partially_refunded",
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  await db.insert(platformAdminActions).values({
    id: sql`gen_random_uuid()`,
    platformAdminUserId: adminUserId,
    action: isFull ? "refund_invoice_full" : "refund_invoice_partial",
    entityType: "invoice",
    entityId: invoiceId,
    organizationId: invoice.organizationId,
    afterSnapshot: {
      refundId: refund.id,
      amountCents: refundedCents,
      reason: reasonEnum,
      stripeInvoiceId: invoice.externalInvoiceId,
    },
  });

  return {
    refundId: refund.id,
    amountCents: refundedCents,
    status: refund.status ?? "pending",
  };
}
