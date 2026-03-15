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

export const domainEvents = pgTable("domain_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  eventType: text("event_type").notNull(),
  aggregateType: text("aggregate_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  payload: jsonb("payload"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
  retryCount: integer("retry_count").default(0).notNull(),
  lastError: text("last_error"),
});

export const jobQueue = pgTable("job_queue", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  jobType: text("job_type").notNull(),
  dedupeKey: text("dedupe_key"),
  payload: jsonb("payload"),
  status: text("status").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(1).notNull(),
  scheduledFor: timestamp("scheduled_for"),
  lockedAt: timestamp("locked_at"),
  lockedBy: text("locked_by"),
  lastError: text("last_error"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

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
