import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { user } from "../auth-schema";
import { createdAt, updatedAt } from "./helpers";

export const organizations = pgTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    timezone: text("timezone"),
    currencyCode: text("currency_code"),
    isActive: boolean("is_active").default(true).notNull(),
    status: text("status").notNull().default("active"),
    suspendedAt: timestamp("suspended_at"),
    suspendedReason: text("suspended_reason"),
    suspendedByAdminUserId: text("suspended_by_admin_user_id").references(() => user.id),
    restoredAt: timestamp("restored_at"),
    /**
     * India GST registration. Snapshotted onto each invoice at creation
     * time so historical invoices remain reproducible even if the org
     * later updates its GSTIN.
     */
    gstin: text("gstin"),
    /** Two-digit GST state code derived from `gstin` (or set explicitly for unregistered orgs). */
    gstStateCode: text("gst_state_code"),
    /** Legal entity name on the GST registration (may differ from `name`). */
    gstLegalName: text("gst_legal_name"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [uniqueIndex("organizations_slug_unique").on(table.slug)],
);

export const organizationSettings = pgTable(
  "organization_settings",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    requireEmailVerification: boolean("require_email_verification").default(false).notNull(),
    logoUrl: text("logo_url"),
    brandColor: text("brand_color"),
    sessionTimeoutHours: integer("session_timeout_hours"),
    ipAllowlist: jsonb("ip_allowlist").$type<string[]>(),
    ssoConfig: jsonb("sso_config").$type<Record<string, unknown>>(),
    rolePermissionsConfig:
      jsonb("role_permissions_config").$type<
        import("@/config/role-permissions").RolePermissionsConfig
      >(),
    onboardingCompletedAt: timestamp("onboarding_completed_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("organization_settings_organization_unique").on(table.organizationId)],
);

export const roles = pgTable(
  "roles",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("roles_scope_key_unique").on(table.scope, table.key)],
);

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id),
    status: text("status").notNull(),
    joinedAt: timestamp("joined_at"),
    invitedByUserId: text("invited_by_user_id").references(() => user.id),
    permissionOverrides:
      jsonb("permission_overrides").$type<
        Record<string, import("@/config/role-permissions").MemberPermissionOverride>
      >(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("organization_memberships_org_user_unique").on(table.organizationId, table.userId),
  ],
);

export const organizationInvitations = pgTable("organization_invitations", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id),
  tokenHash: text("token_hash").notNull(),
  invitedByUserId: text("invited_by_user_id").references(() => user.id),
  status: text("status").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const permissions = pgTable(
  "permissions",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    description: text("description"),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("permissions_key_unique").on(table.key)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: text("id").primaryKey(),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("role_permissions_role_permission_unique").on(table.roleId, table.permissionId),
  ],
);

export const outboundWebhooks = pgTable(
  "outbound_webhooks",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    events: jsonb("events").$type<string[]>().default([]).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    lastTriggeredAt: timestamp("last_triggered_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("outbound_webhooks_organization_idx").on(table.organizationId)],
);

/**
 * Delivery log + dead-letter queue for outbound webhooks.
 *
 * One row per dispatch - written after the retry loop in dispatch.ts. Status:
 *   - "delivered"      → 2xx received within the retry budget
 *   - "permanent_fail" → 4xx (no point retrying - endpoint rejected payload)
 *   - "exhausted"      → all retries timed out / 5xx'd; eligible for replay
 *
 * Replay-from-DLQ surfaces in /admin/webhook-deliveries - admin selects rows
 * and triggers a fresh dispatch with the original event + payload.
 */
export const outboundWebhookDeliveries = pgTable(
  "outbound_webhook_deliveries",
  {
    id: text("id").primaryKey(),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => outboundWebhooks.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: text("status").notNull(),
    attempts: integer("attempts").notNull(),
    responseStatus: integer("response_status"),
    error: text("error"),
    deliveredAt: timestamp("delivered_at"),
    replayOfDeliveryId: text("replay_of_delivery_id"),
    createdAt: createdAt(),
  },
  (table) => [
    index("outbound_webhook_deliveries_webhook_idx").on(table.webhookId),
    index("outbound_webhook_deliveries_organization_idx").on(table.organizationId),
    index("outbound_webhook_deliveries_status_idx").on(table.status),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("api_keys_organization_idx").on(table.organizationId),
    uniqueIndex("api_keys_hash_unique").on(table.keyHash),
  ],
);
