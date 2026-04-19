import {
  AnyPgColumn,
  boolean,
  index,
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

export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  company: text("company"),
  status: text("status").notNull(),
  notes: text("notes"),
  createdByUserId: text("created_by_user_id").references(() => user.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: timestamp("deleted_at"),
});

export const clientNotes = pgTable("client_notes", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("general"),
  content: text("content").notNull(),
  createdByUserId: text("created_by_user_id").references(() => user.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull(),
  priority: text("priority"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  budgetType: text("budget_type"),
  budgetCents: integer("budget_cents"),
  createdByUserId: text("created_by_user_id").references(() => user.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: timestamp("deleted_at"),
});

export const projectFiles = pgTable("project_files", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  uploadedByUserId: text("uploaded_by_user_id").references(() => user.id),
  storageProvider: text("storage_provider").notNull().default("cloudinary"),
  storageKey: text("storage_key").notNull(),   // Cloudinary public_id
  storageUrl: text("storage_url").notNull(),    // Cloudinary secure_url
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  createdAt: createdAt(),
});

export const projectMembers = pgTable(
  "project_members",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectRole: text("project_role"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("project_members_project_user_unique").on(
      table.projectId,
      table.userId,
    ),
  ],
);

// taskBoardColumns is defined before tasks so the FK reference from tasks -> taskBoardColumns resolves correctly
export const taskBoardColumns = pgTable("task_board_columns", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  columnType: text("column_type"), // 'todo' | 'in_progress' | 'testing_qa' | 'completed' | null
  description: text("description"),
  position: integer("position").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  columnId: text("column_id").references(() => taskBoardColumns.id, {
    onDelete: "set null",
  }),
  parentTaskId: text("parent_task_id").references(
    (): AnyPgColumn => tasks.id,
    { onDelete: "set null" },
  ),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull(),
  priority: text("priority"),
  assigneeUserId: text("assignee_user_id").references(() => user.id),
  reporterUserId: text("reporter_user_id").references(() => user.id),
  dueDate: timestamp("due_date"),
  lastOverdueNotifiedAt: timestamp("last_overdue_notified_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  position: integer("position"),
  estimateMinutes: integer("estimate_minutes"),
  estimateSetAt: timestamp("estimate_set_at"),
  actualMinutes: integer("actual_minutes"),
  refNumber: text("ref_number"),
  tags: text("tags").array().notNull().default([]),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: timestamp("deleted_at"),
});

export const taskComments = pgTable("task_comments", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  isInternal: boolean("is_internal").default(false).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: timestamp("deleted_at"),
});

export const taskAttachments = pgTable("task_attachments", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  uploadedByUserId: text("uploaded_by_user_id").references(() => user.id),
  storageProvider: text("storage_provider").notNull(),
  storageKey: text("storage_key").notNull(),
  storageUrl: text("storage_url"),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  createdAt: createdAt(),
});

export const taskAuditLogs = pgTable("task_audit_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").references(() => user.id),
  action: text("action").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  createdAt: createdAt(),
});

export const taskAssignees = pgTable(
  "task_assignees",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    assignedAt: createdAt(),
  },
  (table) => [
    uniqueIndex("task_assignees_task_user_unique").on(
      table.taskId,
      table.userId,
    ),
  ],
);

export const timeEntries = pgTable(
  "time_entries",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    minutes: integer("minutes").notNull(),
    description: text("description"),
    loggedAt: timestamp("logged_at").notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("time_entries_project_idx").on(table.projectId),
    index("time_entries_task_idx").on(table.taskId),
  ],
);

export type ProjectTemplateTask = {
  title: string;
  description?: string;
  priority?: string;
  dueDaysFromStart?: number;
};

export const projectTemplates = pgTable("project_templates", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  defaultStatus: text("default_status").default("planning").notNull(),
  defaultPriority: text("default_priority"),
  tasks: jsonb("tasks").$type<ProjectTemplateTask[]>().default([]).notNull(),
  createdByUserId: text("created_by_user_id").references(() => user.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
