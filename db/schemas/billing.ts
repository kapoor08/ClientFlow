import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./access";
import { createdAt, updatedAt } from "./helpers";

export const plans = pgTable(
  "plans",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    currencyCode: text("currency_code"),
    monthlyPriceCents: integer("monthly_price_cents"),
    yearlyPriceCents: integer("yearly_price_cents"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("plans_code_unique").on(table.code)],
);

export const planFeatureFlags = pgTable(
  "plan_feature_flags",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    featureKey: text("feature_key").notNull(),
    isEnabled: boolean("is_enabled").default(false).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("plan_feature_flags_plan_feature_unique").on(
      table.planId,
      table.featureKey,
    ),
  ],
);

export const planFeatureLimits = pgTable(
  "plan_feature_limits",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    featureKey: text("feature_key").notNull(),
    limitValue: integer("limit_value"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("plan_feature_limits_plan_feature_unique").on(
      table.planId,
      table.featureKey,
    ),
  ],
);

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  status: text("status").notNull(),
  billingCycle: text("billing_cycle"),
  startedAt: timestamp("started_at"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  endedAt: timestamp("ended_at"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const organizationCurrentSubscriptions = pgTable(
  "organization_current_subscriptions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("organization_current_subscriptions_org_unique").on(
      table.organizationId,
    ),
  ],
);

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  subscriptionId: text("subscription_id").references(() => subscriptions.id),
  externalInvoiceId: text("external_invoice_id"),
  status: text("status").notNull(),
  amountDueCents: integer("amount_due_cents"),
  amountPaidCents: integer("amount_paid_cents"),
  currencyCode: text("currency_code"),
  invoiceUrl: text("invoice_url"),
  dueAt: timestamp("due_at"),
  paidAt: timestamp("paid_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const usageCounters = pgTable("usage_counters", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  featureKey: text("feature_key").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  usedValue: integer("used_value").default(0).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const billingWebhookEvents = pgTable("billing_webhook_events", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  eventId: text("event_id").notNull(),
  eventType: text("event_type").notNull(),
  organizationId: text("organization_id").references(() => organizations.id),
  payload: jsonb("payload"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processingError: text("processing_error"),
});

export const apiIdempotencyKeys = pgTable(
  "api_idempotency_keys",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    requestHash: text("request_hash"),
    responseCode: integer("response_code"),
    responseBody: jsonb("response_body"),
    expiresAt: timestamp("expires_at"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("api_idempotency_keys_org_key_unique").on(
      table.organizationId,
      table.key,
    ),
  ],
);
