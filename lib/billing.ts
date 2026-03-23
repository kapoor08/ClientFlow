import "server-only";

import { and, count, desc, eq, isNull } from "drizzle-orm";
import {
  plans,
  planFeatureLimits,
  subscriptions,
  organizationCurrentSubscriptions,
  invoices,
  clients,
  projects,
  organizationMemberships,
} from "@/db/schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";

export type BillingInvoiceItem = {
  id: string;
  status: string;
  amountDueCents: number | null;
  amountPaidCents: number | null;
  currencyCode: string | null;
  invoiceUrl: string | null;
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
  };
  invoices: BillingInvoiceItem[];
};

export async function getBillingContextForUser(
  userId: string,
): Promise<BillingContext | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const orgId = context.organizationId;

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

  // Real usage counts + invoices — run in parallel
  const [memberCountRows, projectCountRows, clientCountRows, orgInvoices] =
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
        .select({
          id: invoices.id,
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
        .where(eq(invoices.organizationId, orgId))
        .orderBy(desc(invoices.createdAt))
        .limit(20),
    ]);

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
    },
    invoices: orgInvoices,
  };
}
