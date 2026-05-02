import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "../auth-schema";
import { createdAt, updatedAt } from "./helpers";

/**
 * Probe configuration stored as a discriminated union in `probeConfig`.
 *
 * Storing this as JSON instead of flat columns lets us add new probe kinds
 * (e.g. external HTTP probes, dependency-chain probes) without a migration.
 *
 * - `http`: hit a URL, expect a specific status code. Optional auth header
 *   sourced from an env var so secrets never sit in the DB.
 * - `stripe_balance`: cheap outbound Stripe call (`stripe.balance.retrieve()`)
 *   to verify the Stripe API path is alive.
 * - `signal`: indirect probe. Reads `status_service_signals.lastObservedAt`
 *   for the given key and considers the component degraded if the signal
 *   hasn't been observed within `staleAfterMin` minutes.
 */
export type ProbeConfig =
  | {
      kind: "http";
      url: string;
      method: "GET" | "POST";
      expectedStatus: number;
      authHeader?: string;
      authValueEnv?: string;
      body?: string;
    }
  | { kind: "stripe_balance" }
  | { kind: "signal"; signalKey: string; staleAfterMin: number };

export type ComponentState = "operational" | "degraded" | "outage" | "maintenance" | "unknown";

export type IncidentState = "investigating" | "identified" | "monitoring" | "resolved";

export type IncidentImpact = "none" | "minor" | "major" | "critical";

// ─── Components ───────────────────────────────────────────────────────────────

export const statusComponents = pgTable(
  "status_components",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    probeConfig: jsonb("probe_config").$type<ProbeConfig>().notNull(),
    /**
     * Cached state recomputed by the prober every cycle. Public page reads
     * this directly so the render path doesn't have to scan recent checks.
     */
    currentState: text("current_state").$type<ComponentState>().notNull().default("unknown"),
    stateUpdatedAt: timestamp("state_updated_at"),
    /**
     * Auto-incident threshold. When a component has been in `outage` for at
     * least this many consecutive minutes and no open incident covers it,
     * the prober opens one. Null disables the behavior.
     */
    autoOpenIncidentAfterMin: integer("auto_open_incident_after_min"),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("status_components_slug_unique").on(table.slug)],
);

// ─── Probe results (raw, 90-day retention) ────────────────────────────────────

export const statusCheckResults = pgTable(
  "status_check_results",
  {
    id: text("id").primaryKey(),
    componentId: text("component_id")
      .notNull()
      .references(() => statusComponents.id, { onDelete: "cascade" }),
    checkedAt: timestamp("checked_at").notNull().defaultNow(),
    success: boolean("success").notNull(),
    latencyMs: integer("latency_ms"),
    httpStatus: integer("http_status"),
    error: text("error"),
  },
  (table) => [
    // Hot path: "last N probes for component X" - drives current-state
    // recomputation.
    index("status_check_results_component_checked_idx").on(table.componentId, table.checkedAt),
  ],
);

// ─── Daily rollups (powers the 90-day uptime bar) ─────────────────────────────

export const statusCheckDailyRollups = pgTable(
  "status_check_daily_rollups",
  {
    id: text("id").primaryKey(),
    componentId: text("component_id")
      .notNull()
      .references(() => statusComponents.id, { onDelete: "cascade" }),
    /**
     * UTC midnight. Matches the convention used by the existing
     * platformAnalyticsDailyMetrics table.
     */
    date: timestamp("date").notNull(),
    totalChecks: integer("total_checks").notNull(),
    successfulChecks: integer("successful_checks").notNull(),
    /**
     * Uptime in basis points (0-10000). Two decimal places of precision
     * without floating-point: 9985 = 99.85%. Avoids float drift on aggregation.
     */
    uptimeBp: integer("uptime_bp").notNull(),
    avgLatencyMs: integer("avg_latency_ms"),
    /**
     * The worst state observed during the day, factoring in any maintenance
     * windows that overlapped. Used to color the 90-day bar segment.
     */
    worstStateOnDay: text("worst_state_on_day").$type<ComponentState>().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("status_check_daily_rollups_component_date_unique").on(
      table.componentId,
      table.date,
    ),
  ],
);

// ─── Indirect-probe signals ───────────────────────────────────────────────────

/**
 * Heartbeat-style signals that the prober reads when evaluating components
 * with `probeConfig.kind === "signal"`. Bumped from inside the app:
 *
 *   - `email_send_success` - bumped after every successful Resend response
 *   - `stripe_webhook_received` - bumped on every signed webhook ingest
 *
 * One row per signal; UPSERT updates `lastObservedAt`.
 */
export const statusServiceSignals = pgTable("status_service_signals", {
  signalKey: text("signal_key").primaryKey(),
  lastObservedAt: timestamp("last_observed_at").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

// ─── Incidents ────────────────────────────────────────────────────────────────

export const statusIncidents = pgTable(
  "status_incidents",
  {
    id: text("id").primaryKey(),
    /**
     * Human-readable URL slug, e.g. "payment-delays-mar-3". Auto-generated
     * from the title at create time and immutable thereafter.
     */
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
    currentState: text("current_state").$type<IncidentState>().notNull(),
    impact: text("impact").$type<IncidentImpact>().notNull(),
    /**
     * Scheduled maintenance vs. unplanned incident. When `isScheduled` is
     * true, `scheduledFor`/`scheduledUntil` define the window and the daily
     * rollup overlays the segment with maintenance color rather than red.
     */
    isScheduled: boolean("is_scheduled").notNull().default(false),
    scheduledFor: timestamp("scheduled_for"),
    scheduledUntil: timestamp("scheduled_until"),
    postedByUserId: text("posted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    /**
     * True when the prober opened the incident automatically after a
     * sustained outage. Lets us distinguish auto-noise from human-curated
     * communication in admin views.
     */
    isAutoOpened: boolean("is_auto_opened").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("status_incidents_slug_unique").on(table.slug),
    index("status_incidents_state_idx").on(table.currentState),
    index("status_incidents_started_idx").on(table.startedAt),
  ],
);

// ─── Incident timeline updates ────────────────────────────────────────────────

export const statusIncidentUpdates = pgTable(
  "status_incident_updates",
  {
    id: text("id").primaryKey(),
    incidentId: text("incident_id")
      .notNull()
      .references(() => statusIncidents.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    /**
     * State the incident transitions to at the moment of this update.
     * Rendered as a chip on the public timeline.
     */
    stateAtPost: text("state_at_post").$type<IncidentState>().notNull(),
    postedByUserId: text("posted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (table) => [index("status_incident_updates_incident_idx").on(table.incidentId, table.createdAt)],
);

// ─── Incident ↔ component join ────────────────────────────────────────────────

export const statusIncidentComponents = pgTable(
  "status_incident_components",
  {
    incidentId: text("incident_id")
      .notNull()
      .references(() => statusIncidents.id, { onDelete: "cascade" }),
    componentId: text("component_id")
      .notNull()
      .references(() => statusComponents.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.incidentId, table.componentId] })],
);

// ─── Subscribers ──────────────────────────────────────────────────────────────

export const statusSubscribers = pgTable(
  "status_subscribers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    /**
     * Random opaque token (set at signup, cleared on verify). Unsubscribes
     * use the existing HMAC unsubscribe-token utility instead, so no separate
     * column is needed for that flow.
     */
    verificationToken: text("verification_token"),
    verificationExpiresAt: timestamp("verification_expires_at"),
    verifiedAt: timestamp("verified_at"),
    /**
     * Per-recipient throttle. The notification dispatcher refuses to send if
     * the previous send was within the throttle window (default 60s). Stops
     * a flapping incident from generating a flurry of emails per subscriber.
     */
    lastEmailedAt: timestamp("last_emailed_at"),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("status_subscribers_email_unique").on(table.email)],
);
