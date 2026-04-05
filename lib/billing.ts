import "server-only";

import { and, count, desc, eq, gte, isNotNull, isNull, lte } from "drizzle-orm";
import {
  plans,
  planFeatureLimits,
  subscriptions,
  organizationCurrentSubscriptions,
  invoices,
  clients,
  projects,
  organizationMemberships,
  usageCounters,
} from "@/db/schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { getPlanLimits } from "@/config/plan-limits";
import { stripe } from "@/lib/stripe";
import {
  buildPaginationMeta,
  paginationOffset,
  type PaginationMeta,
} from "@/lib/pagination";

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
  dueAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
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
  currentPeriodEnd: Date | null;
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

function maskId(value: string | null | undefined) {
  if (!value) return null;
  return value.length <= 10 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function summarizeInvoices(invoices: BillingInvoiceItem[]) {
  return invoices.slice(0, 5).map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    externalInvoiceId: invoice.externalInvoiceId,
    status: invoice.status,
    amountDueCents: invoice.amountDueCents,
    amountPaidCents: invoice.amountPaidCents,
    hasInvoiceUrl: !!invoice.invoiceUrl,
    hasInvoicePdfUrl: !!invoice.invoicePdfUrl,
  }));
}

function getSubscriptionIdFromStripeInvoice(invoice: {
  parent?: unknown;
  subscription?: unknown;
}): string | null {
  const parent =
    invoice.parent && typeof invoice.parent === "object"
      ? (invoice.parent as Record<string, unknown>)
      : undefined;
  const subscriptionDetails =
    parent?.subscription_details &&
    typeof parent.subscription_details === "object"
      ? (parent.subscription_details as Record<string, unknown>)
      : undefined;
  const subscriptionItem =
    parent?.subscription_item &&
    typeof parent.subscription_item === "object"
      ? (parent.subscription_item as Record<string, unknown>)
      : undefined;
  const fromParentSubscriptionDetails =
    typeof subscriptionDetails?.subscription === "string"
      ? subscriptionDetails.subscription
      : null;
  const fromParentSubscriptionItem =
    typeof subscriptionItem?.subscription === "string"
      ? subscriptionItem.subscription
      : null;
  const fromLegacy =
    typeof invoice.subscription === "string" ? invoice.subscription : null;

  return (
    fromParentSubscriptionDetails ??
    fromParentSubscriptionItem ??
    fromLegacy
  );
}

async function listStripeSubscriptionInvoices(
  subscriptionRows: {
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
  }[],
  options: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    page: number;
    pageSize: number;
  },
): Promise<{ invoices: BillingInvoiceItem[]; pagination: PaginationMeta } | null> {
  const stripeCustomerIds = Array.from(
    new Set(
      subscriptionRows
        .map((row) => row.stripeCustomerId)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const subscriptionIds = new Set(
    subscriptionRows
      .map((row) => row.stripeSubscriptionId)
      .filter((value): value is string => Boolean(value)),
  );

  if (stripeCustomerIds.length === 0 || subscriptionIds.size === 0) {
    console.log("[Billing][Invoices] Stripe lookup skipped", {
      stripeCustomerIds: stripeCustomerIds.map(maskId),
      subscriptionIds: Array.from(subscriptionIds).map(maskId),
      reason: stripeCustomerIds.length === 0
        ? "missing_stripe_customer_id"
        : "missing_subscription_ids",
    });
    return null;
  }

  try {
    const created =
      options.dateFrom || options.dateTo
        ? {
            ...(options.dateFrom
              ? { gte: Math.floor(options.dateFrom.getTime() / 1000) }
              : {}),
            ...(options.dateTo
              ? { lte: Math.floor(options.dateTo.getTime() / 1000) }
              : {}),
          }
        : undefined;

    console.log("[Billing][Invoices] Fetching Stripe invoices", {
      stripeCustomerIds: stripeCustomerIds.map(maskId),
      subscriptionIds: Array.from(subscriptionIds).map(maskId),
      dateFrom: options.dateFrom?.toISOString() ?? null,
      dateTo: options.dateTo?.toISOString() ?? null,
      page: options.page,
      pageSize: options.pageSize,
    });

    const stripeInvoices: Awaited<ReturnType<typeof stripe.invoices.list>>["data"] = [];

    for (const customerId of stripeCustomerIds) {
      let startingAfter: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const page = await stripe.invoices.list({
          customer: customerId,
          limit: 100,
          ...(created ? { created } : {}),
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        });

        stripeInvoices.push(...page.data);
        hasMore = page.has_more;
        startingAfter = page.data.at(-1)?.id;
      }
    }

    const uniqueStripeInvoices = Array.from(
      new Map(stripeInvoices.map((invoice) => [invoice.id, invoice])).values(),
    );

    const filteredInvoices = uniqueStripeInvoices
      .filter((invoice) => {
        const subscriptionId = getSubscriptionIdFromStripeInvoice(invoice);
        if (!subscriptionId || !subscriptionIds.has(subscriptionId)) return false;
        if (options.status && invoice.status !== options.status) return false;
        return true;
      })
      .sort((a, b) => b.created - a.created)
      .map((invoice) => ({
        id: invoice.id,
        number: invoice.number ?? null,
        externalInvoiceId: invoice.id,
        status: invoice.status ?? "unknown",
        amountDueCents: invoice.amount_due,
        amountPaidCents: invoice.amount_paid,
        currencyCode: invoice.currency?.toUpperCase() ?? null,
        invoiceUrl: invoice.hosted_invoice_url ?? null,
        invoicePdfUrl: invoice.invoice_pdf ?? null,
        dueAt: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        paidAt: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : null,
        createdAt: new Date(invoice.created * 1000),
      }));

    const pagination = buildPaginationMeta(
      filteredInvoices.length,
      options.page,
      options.pageSize,
    );
    const paginatedInvoices = filteredInvoices.slice(
      paginationOffset(pagination.page, pagination.pageSize),
      paginationOffset(pagination.page, pagination.pageSize) +
        pagination.pageSize,
    );

    console.log("[Billing][Invoices] Stripe invoices fetched", {
      rawCount: uniqueStripeInvoices.length,
      filteredCount: filteredInvoices.length,
      returnedCount: paginatedInvoices.length,
      rawPreview: uniqueStripeInvoices.slice(0, 10).map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        extractedSubscriptionId: maskId(getSubscriptionIdFromStripeInvoice(invoice)),
        customerId:
          typeof invoice.customer === "string" ? maskId(invoice.customer) : null,
        invoicePdfUrl: invoice.invoice_pdf ?? null,
      })),
      preview: summarizeInvoices(paginatedInvoices),
    });

    return { invoices: paginatedInvoices, pagination };
  } catch (error) {
    console.error("[Billing][Invoices] Failed to load Stripe billing invoices:", error);
    return null;
  }
}

export type GetBillingContextOptions = {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  page?: number;
  pageSize?: number;
};

export async function getBillingContextForUser(
  userId: string,
  options: GetBillingContextOptions = {},
): Promise<BillingContext | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const orgId = context.organizationId;
  const {
    dateFrom,
    dateTo,
    status,
    page = 1,
    pageSize = 10,
  } = options;

  console.log("[Billing][Invoices] Loading billing context", {
    userId: maskId(userId),
    organizationId: maskId(orgId),
    dateFrom: dateFrom?.toISOString() ?? null,
    dateTo: dateTo?.toISOString() ?? null,
    page,
    pageSize,
  });

  const subscriptionRows = await db
    .select({
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      stripeCustomerId: subscriptions.stripeCustomerId,
    })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId));

  console.log("[Billing][Invoices] Subscription rows loaded", {
    count: subscriptionRows.length,
    rows: subscriptionRows.map((row) => ({
      stripeSubscriptionId: maskId(row.stripeSubscriptionId),
      stripeCustomerId: maskId(row.stripeCustomerId),
    })),
  });

  // Fetch subscription + plan via the pointer table
  const [subRow] = await db
    .select({
      status: subscriptions.status,
      billingCycle: subscriptions.billingCycle,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      planId: plans.id,
      planName: plans.name,
      planCode: plans.code,
      monthlyPriceCents: plans.monthlyPriceCents,
      yearlyPriceCents: plans.yearlyPriceCents,
    })
    .from(organizationCurrentSubscriptions)
    .innerJoin(
      subscriptions,
      eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id),
    )
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(organizationCurrentSubscriptions.organizationId, orgId))
    .limit(1);

  console.log("[Billing][Invoices] Current subscription loaded", {
    hasSubscription: !!subRow,
    planCode: subRow?.planCode ?? null,
    status: subRow?.status ?? null,
    billingCycle: subRow?.billingCycle ?? null,
  });

  // Fetch plan feature limits if a subscription exists
  let memberLimit: number | null = null;
  let projectLimit: number | null = null;
  let clientLimit: number | null = null;

  if (subRow?.planId) {
    const limits = await db
      .select({
        featureKey: planFeatureLimits.featureKey,
        limitValue: planFeatureLimits.limitValue,
      })
      .from(planFeatureLimits)
      .where(eq(planFeatureLimits.planId, subRow.planId));

    for (const lim of limits) {
      if (lim.featureKey === "team_members") memberLimit = lim.limitValue;
      if (lim.featureKey === "projects") projectLimit = lim.limitValue;
      if (lim.featureKey === "clients") clientLimit = lim.limitValue;
    }
  }

  // Monthly quota limits from plan config
  const planCode = subRow?.planCode ?? "free";
  const planLimits = getPlanLimits(planCode);

  // Fall back to plan config limits when the DB planFeatureLimits table has no rows
  if (memberLimit === null) memberLimit = planLimits.teamMembers;
  if (projectLimit === null) projectLimit = planLimits.projects;
  if (clientLimit === null) clientLimit = planLimits.clients;

  // Current month bounds for usage counters
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Real usage counts + monthly quotas + invoices — run in parallel
  const [
    memberCountRows,
    projectCountRows,
    clientCountRows,
    fallbackInvoiceCountRows,
    fallbackInvoiceRows,
    monthlyUsageRows,
  ] =
    await Promise.all([
      db
        .select({ value: count(organizationMemberships.id) })
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, orgId),
            eq(organizationMemberships.status, "active"),
          ),
        ),

      db
        .select({ value: count(projects.id) })
        .from(projects)
        .where(
          and(
            eq(projects.organizationId, orgId),
            isNull(projects.deletedAt),
          ),
        ),

      db
        .select({ value: count(clients.id) })
        .from(clients)
        .where(
          and(
            eq(clients.organizationId, orgId),
            isNull(clients.deletedAt),
          ),
        ),

      db
        .select({ value: count(invoices.id) })
        .from(invoices)
        .where(
          and(
            eq(invoices.organizationId, orgId),
            isNotNull(invoices.subscriptionId),
            status ? eq(invoices.status, status) : undefined,
            dateFrom ? gte(invoices.createdAt, dateFrom) : undefined,
            dateTo ? lte(invoices.createdAt, dateTo) : undefined,
          ),
        ),

      db
        .select({
          id: invoices.id,
          number: invoices.number,
          externalInvoiceId: invoices.externalInvoiceId,
          status: invoices.status,
          amountDueCents: invoices.amountDueCents,
          amountPaidCents: invoices.amountPaidCents,
          currencyCode: invoices.currencyCode,
          invoiceUrl: invoices.invoiceUrl,
          dueAt: invoices.dueAt,
          paidAt: invoices.paidAt,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.organizationId, orgId),
            isNotNull(invoices.subscriptionId),
            status ? eq(invoices.status, status) : undefined,
            dateFrom ? gte(invoices.createdAt, dateFrom) : undefined,
            dateTo ? lte(invoices.createdAt, dateTo) : undefined,
          ),
        )
        .orderBy(desc(invoices.createdAt))
        .limit(pageSize)
        .offset(paginationOffset(page, pageSize)),

      db
        .select({ featureKey: usageCounters.featureKey, usedValue: usageCounters.usedValue })
        .from(usageCounters)
        .where(
          and(
            eq(usageCounters.organizationId, orgId),
            gte(usageCounters.periodStart, monthStart),
            lte(usageCounters.periodStart, monthEnd),
          ),
        ),
    ]);

  const fallbackInvoices: BillingInvoiceItem[] = fallbackInvoiceRows.map((invoice) => ({
    ...invoice,
    invoicePdfUrl: null,
  }));
  const fallbackPagination = buildPaginationMeta(
    fallbackInvoiceCountRows[0]?.value ?? 0,
    page,
    pageSize,
  );

  console.log("[Billing][Invoices] Fallback DB invoices loaded", {
    count: fallbackInvoices.length,
    total: fallbackPagination.total,
    preview: summarizeInvoices(fallbackInvoices),
  });

  const stripeInvoiceResult = await listStripeSubscriptionInvoices(subscriptionRows, {
    dateFrom,
    dateTo,
    status,
    page,
    pageSize,
  });
  const orgInvoices = stripeInvoiceResult?.invoices ?? fallbackInvoices;
  const invoicePagination = stripeInvoiceResult?.pagination ?? fallbackPagination;

  console.log("[Billing][Invoices] Final invoice source selected", {
    source: stripeInvoiceResult ? "stripe" : "database_fallback",
    count: orgInvoices.length,
    total: invoicePagination.total,
    page: invoicePagination.page,
    pageSize: invoicePagination.pageSize,
    preview: summarizeInvoices(orgInvoices),
  });

  return {
    subscription: subRow
      ? {
          planName: subRow.planName,
          planCode: subRow.planCode,
          status: subRow.status,
          billingCycle: subRow.billingCycle,
          currentPeriodEnd: subRow.currentPeriodEnd,
          monthlyPriceCents: subRow.monthlyPriceCents,
          yearlyPriceCents: subRow.yearlyPriceCents,
          cancelAtPeriodEnd: subRow.cancelAtPeriodEnd,
        }
      : null,
    usage: {
      members: { used: memberCountRows[0]?.value ?? 0, limit: memberLimit },
      projects: { used: projectCountRows[0]?.value ?? 0, limit: projectLimit },
      clients: { used: clientCountRows[0]?.value ?? 0, limit: clientLimit },
      tasksThisMonth: {
        used: monthlyUsageRows.find((r) => r.featureKey === "tasks_created")?.usedValue ?? 0,
        limit: planLimits.tasksPerMonth,
      },
      commentsThisMonth: {
        used: monthlyUsageRows.find((r) => r.featureKey === "comments_created")?.usedValue ?? 0,
        limit: planLimits.commentsPerMonth,
      },
      fileUploadsThisMonth: {
        used: monthlyUsageRows.find((r) => r.featureKey === "files_uploaded")?.usedValue ?? 0,
        limit: planLimits.fileUploadsPerMonth,
      },
    },
    invoices: orgInvoices,
    invoicePagination,
  };
}
