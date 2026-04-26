import {
  boolean,
  index,
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
    description: text("description"),
    currencyCode: text("currency_code"),
    monthlyPriceCents: integer("monthly_price_cents"),
    yearlyPriceCents: integer("yearly_price_cents"),
    trialDays: integer("trial_days"),
    maxSeats: integer("max_seats"),
    maxProjects: integer("max_projects"),
    maxClients: integer("max_clients"),
    monthlyApiCallsLimit: integer("monthly_api_calls_limit"),
    displayOrder: integer("display_order").notNull().default(0),
    recommendedBadge: text("recommended_badge"),
    features: jsonb("features").$type<string[]>(),
    stripeProductId: text("stripe_product_id"),
    stripeMonthlyPriceId: text("stripe_monthly_price_id"),
    stripeYearlyPriceId: text("stripe_yearly_price_id"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("plans_code_unique").on(table.code)],
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
    uniqueIndex("plan_feature_limits_plan_feature_unique").on(table.planId, table.featureKey),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
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
    paymentMethodExpiryNotifiedAt: timestamp("payment_method_expiry_notified_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("subscriptions_organization_idx").on(table.organizationId),
    index("subscriptions_stripe_subscription_idx").on(table.stripeSubscriptionId),
  ],
);

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
    uniqueIndex("organization_current_subscriptions_org_unique").on(table.organizationId),
  ],
);

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id").references(() => subscriptions.id),
    externalInvoiceId: text("external_invoice_id"),
    // Manual invoice fields
    clientId: text("client_id"),
    number: text("number"),
    title: text("title"),
    isManual: boolean("is_manual").default(false).notNull(),
    lineItems: jsonb("line_items").$type<InvoiceLineItem[]>(),
    notes: text("notes"),
    sentAt: timestamp("sent_at"),
    status: text("status").notNull(),
    amountDueCents: integer("amount_due_cents"),
    amountPaidCents: integer("amount_paid_cents"),
    currencyCode: text("currency_code"),
    invoiceUrl: text("invoice_url"),
    dueAt: timestamp("due_at"),
    paidAt: timestamp("paid_at"),
    /** Refund tracking - populated from the Stripe `charge.refunded` event. */
    refundedAt: timestamp("refunded_at"),
    amountRefundedCents: integer("amount_refunded_cents").default(0).notNull(),
    refundReason: text("refund_reason"),
    /**
     * Dunning state. dunningStage maps to the index in DUNNING_DAYS
     * ([1, 3, 7, 14] in server/billing/dunning.ts) of the *last* reminder
     * sent. 0 = none sent yet; 4 = all reminders sent.
     */
    dunningStage: integer("dunning_stage").default(0).notNull(),
    lastDunningAt: timestamp("last_dunning_at"),
    /**
     * India GST snapshot. Captured at invoice-creation time so the historical
     * record is reproducible regardless of later org-side edits. `taxBreakdown`
     * holds the {cgst, sgst, igst, regime, totalTax} payload from
     * `lib/billing/india-gst.ts`. `subtotalCents` is the tax-exclusive base.
     */
    subtotalCents: integer("subtotal_cents"),
    taxBreakdown: jsonb("tax_breakdown").$type<{
      regime: "intra_state" | "inter_state" | "exempt";
      cgstCents: number;
      sgstCents: number;
      igstCents: number;
      totalTaxCents: number;
    }>(),
    gstinAtInvoice: text("gstin_at_invoice"),
    hsnSacCode: text("hsn_sac_code"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("invoices_organization_idx").on(table.organizationId),
    index("invoices_subscription_idx").on(table.subscriptionId),
    index("invoices_external_invoice_idx").on(table.externalInvoiceId),
    index("invoices_dunning_idx").on(table.status, table.dunningStage),
  ],
);

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
    uniqueIndex("api_idempotency_keys_org_key_unique").on(table.organizationId, table.key),
  ],
);
