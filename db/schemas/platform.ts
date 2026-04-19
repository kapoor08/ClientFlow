import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "../auth-schema";
import { organizations } from "./access";
import { createdAt, updatedAt } from "./helpers";

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  actionUrl: text("action_url"),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: createdAt(),
});

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: text("id").primaryKey(),
  notificationId: text("notification_id")
    .notNull()
    .references(() => notifications.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  status: text("status").notNull(),
  providerMessageId: text("provider_message_id"),
  attempts: integer("attempts").default(0).notNull(),
  sentAt: timestamp("sent_at"),
  lastError: text("last_error"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventKey: text("event_key").notNull(),
    inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
    emailEnabled: boolean("email_enabled").default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("notification_preferences_user_event_unique").on(
      table.organizationId,
      table.userId,
      table.eventKey,
    ),
  ],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: createdAt(),
});

export const analyticsDailyOrgMetrics = pgTable(
  "analytics_daily_org_metrics",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    metricDate: timestamp("metric_date").notNull(),
    projectsTotal: integer("projects_total"),
    projectsActive: integer("projects_active"),
    tasksCreated: integer("tasks_created"),
    tasksCompleted: integer("tasks_completed"),
    activeUsers: integer("active_users"),
    revenueCents: integer("revenue_cents"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("analytics_daily_org_metrics_org_date_unique").on(
      table.organizationId,
      table.metricDate,
    ),
  ],
);

export const analyticsMonthlyOrgMetrics = pgTable(
  "analytics_monthly_org_metrics",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    metricMonth: timestamp("metric_month").notNull(),
    newClients: integer("new_clients"),
    retainedClients: integer("retained_clients"),
    taskCompletionRate: numeric("task_completion_rate"),
    mrrCents: integer("mrr_cents"),
    churnRate: numeric("churn_rate"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("analytics_monthly_org_metrics_org_month_unique").on(
      table.organizationId,
      table.metricMonth,
    ),
  ],
);

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  actorUserId: text("actor_user_id").references(() => user.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: createdAt(),
});

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    id: text("id").primaryKey(),
    scopeType: text("scope_type").notNull(),
    scopeKey: text("scope_key").notNull(),
    routeKey: text("route_key").notNull(),
    windowStart: timestamp("window_start").notNull(),
    windowEnd: timestamp("window_end").notNull(),
    requestCount: integer("request_count").default(0).notNull(),
    blockedUntil: timestamp("blocked_until"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("rate_limit_buckets_scope_route_window_unique").on(
      table.scopeType,
      table.scopeKey,
      table.routeKey,
      table.windowStart,
    ),
  ],
);

// ── Platform admin operational tables ────────────────────────────────────────

export const impersonationSessions = pgTable("impersonation_sessions", {
  id: text("id").primaryKey(),
  platformAdminUserId: text("platform_admin_user_id")
    .notNull()
    .references(() => user.id),
  targetUserId: text("target_user_id")
    .notNull()
    .references(() => user.id),
  targetOrganizationId: text("target_organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  reason: text("reason"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  endedAt: timestamp("ended_at"),
  createdAt: createdAt(),
});

export const platformAdminActions = pgTable("platform_admin_actions", {
  id: text("id").primaryKey(),
  platformAdminUserId: text("platform_admin_user_id")
    .notNull()
    .references(() => user.id),
  impersonatedAsUserId: text("impersonated_as_user_id").references(() => user.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  organizationId: text("organization_id").references(() => organizations.id),
  beforeSnapshot: jsonb("before_snapshot"),
  afterSnapshot: jsonb("after_snapshot"),
  reason: text("reason"),
  ipAddress: text("ip_address"),
  createdAt: createdAt(),
});

// ── Platform-wide analytics tables ───────────────────────────────────────────

export const platformAnalyticsDailyMetrics = pgTable(
  "platform_analytics_daily_metrics",
  {
    id: text("id").primaryKey(),
    metricDate: timestamp("metric_date").notNull().unique(),
    newSignups: integer("new_signups").default(0).notNull(),
    activeOrgs: integer("active_orgs").default(0).notNull(),
    dau: integer("dau").default(0).notNull(),
    mau: integer("mau").default(0).notNull(),
    newSubscriptions: integer("new_subscriptions").default(0).notNull(),
    canceledSubscriptions: integer("canceled_subscriptions").default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
);

export const platformAnalyticsMonthlyMetrics = pgTable(
  "platform_analytics_monthly_metrics",
  {
    id: text("id").primaryKey(),
    metricMonth: timestamp("metric_month").notNull().unique(),
    mrrCents: integer("mrr_cents").default(0).notNull(),
    arrCents: integer("arr_cents").default(0).notNull(),
    newOrgs: integer("new_orgs").default(0).notNull(),
    churnedOrgs: integer("churned_orgs").default(0).notNull(),
    churnRate: numeric("churn_rate"),
    trialConversionRate: numeric("trial_conversion_rate"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
);
