import "server-only";

import { addDays } from "date-fns";
import { and, count, desc, eq, gte, ilike } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  organizations,
  plans,
  subscriptions,
  organizationCurrentSubscriptions,
} from "@/db/schema";
import {
  buildPaginationMeta,
  paginationOffset,
  type PaginatedResult,
} from "@/utils/pagination";

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
    .innerJoin(organizations, eq(organizationCurrentSubscriptions.organizationId, organizations.id));

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
    db.select({ value: count(subscriptions.id) }).from(subscriptions).where(eq(subscriptions.status, "active")),
    db.select({ value: count(subscriptions.id) }).from(subscriptions).where(eq(subscriptions.status, "trialing")),
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

export async function extendTrial(subscriptionId: string, days: number) {
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

  return newTrialEnd;
}

export async function changeSubscriptionPlan(subscriptionId: string, newPlanId: string) {
  await db
    .update(subscriptions)
    .set({ planId: newPlanId, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));
}

export async function setCancelAtPeriodEnd(subscriptionId: string, value: boolean) {
  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: value, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));
}
