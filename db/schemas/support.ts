import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "../auth-schema";
import { organizations } from "./access";
import { createdAt, updatedAt } from "./helpers";

// ── Support tickets ───────────────────────────────────────────────────────────

export const supportTickets = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id),
  assignedPlatformAdminUserId: text("assigned_platform_admin_user_id").references(
    () => user.id,
  ),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("open"),
  firstResponseDueAt: timestamp("first_response_due_at"),
  firstRespondedAt: timestamp("first_responded_at"),
  resolutionDueAt: timestamp("resolution_due_at"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  escalationLevel: integer("escalation_level").notNull().default(0),
  lastEscalatedAt: timestamp("last_escalated_at"),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const supportTicketMessages = pgTable("support_ticket_messages", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id")
    .notNull()
    .references(() => user.id),
  authorRole: text("author_role").notNull(),
  body: text("body").notNull(),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const supportTicketAttachments = pgTable("support_ticket_attachments", {
  id: text("id").primaryKey(),
  messageId: text("message_id")
    .notNull()
    .references(() => supportTicketMessages.id, { onDelete: "cascade" }),
  uploadedByUserId: text("uploaded_by_user_id")
    .notNull()
    .references(() => user.id),
  storageProvider: text("storage_provider").notNull(),
  storageKey: text("storage_key").notNull(),
  storageUrl: text("storage_url").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: createdAt(),
});

export const supportTicketEvents = pgTable("support_ticket_events", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").references(() => user.id),
  eventType: text("event_type").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  createdAt: createdAt(),
});

export const supportEscalationRules = pgTable(
  "support_escalation_rules",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    priority: text("priority").notNull(),
    hoursWithoutResponse: integer("hours_without_response").notNull(),
    action: text("action").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("support_escalation_rules_org_priority_action_unique").on(
      table.organizationId,
      table.priority,
      table.action,
    ),
  ],
);

export const supportSlaConfig = pgTable(
  "support_sla_config",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    priority: text("priority").notNull(),
    firstResponseMinutes: integer("first_response_minutes").notNull(),
    resolutionMinutes: integer("resolution_minutes").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("support_sla_config_org_priority_unique").on(
      table.organizationId,
      table.priority,
    ),
  ],
);

// ── Contact form submissions ──────────────────────────────────────────────────

export const contactSubmissions = pgTable("contact_submissions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  processedByUserId: text("processed_by_user_id").references(() => user.id),
  notes: text("notes"),
  convertedToTicketId: text("converted_to_ticket_id").references(
    () => supportTickets.id,
  ),
  createdAt: createdAt(),
  processedAt: timestamp("processed_at"),
});
