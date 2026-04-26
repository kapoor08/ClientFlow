import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { clients, projects, tasks, taskBoardColumns } from "@/db/schema";
import { writeAuditLog } from "@/server/security/audit";
import { dispatchWebhookEvent } from "@/server/webhooks/dispatch";
import { ApiError } from "@/server/api/helpers";

/**
 * Mutating helpers for the public `/api/v1` surface. Unlike the
 * `*ForUser` helpers in `server/{clients,projects,tasks}.ts`, these accept
 * an organizationId directly (the v1 caller is an API key, not a user) and
 * record audit-log + webhook side effects with `actorUserId: null`.
 *
 * Plan-limit enforcement is intentionally NOT applied here yet - the existing
 * `enforceClientCap` etc. throw `PlanLimitError` from request paths designed
 * for human users with upgrade flows. Calling them from an API path would
 * surface as a 402 with no actionable information for an integration. A
 * follow-up should add a v1-specific cap-check that returns a structured
 * `{error, limit, current, upgradeUrl}` payload.
 */

// ─── Clients ──────────────────────────────────────────────────────────────────

export type CreateClientV1Input = {
  name: string;
  company?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status?: "active" | "inactive" | "archived";
  notes?: string | null;
};

export async function createClientV1(organizationId: string, input: CreateClientV1Input) {
  if (!input.name?.trim()) {
    throw new ApiError("`name` is required.", 422);
  }
  const status = input.status ?? "active";
  const clientId = crypto.randomUUID();

  await db.insert(clients).values({
    id: clientId,
    organizationId,
    name: input.name.trim(),
    company: input.company ?? null,
    contactName: input.contactName ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    status,
    notes: input.notes ?? null,
  });

  writeAuditLog({
    organizationId,
    actorUserId: null,
    action: "client.created",
    entityType: "client",
    entityId: clientId,
    metadata: { name: input.name, source: "api_v1" },
  }).catch(console.error);

  dispatchWebhookEvent(organizationId, "client.created", {
    clientId,
    name: input.name,
    status,
  }).catch(console.error);

  return { clientId };
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export type CreateProjectV1Input = {
  name: string;
  clientId: string;
  description?: string | null;
  status?: string;
  priority?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  budgetType?: string | null;
  budgetCents?: number | null;
};

export async function createProjectV1(organizationId: string, input: CreateProjectV1Input) {
  if (!input.name?.trim()) throw new ApiError("`name` is required.", 422);
  if (!input.clientId) throw new ApiError("`clientId` is required.", 422);

  // Verify the referenced client belongs to this org before inserting -
  // the FK would raise but with a less helpful message.
  const [clientRow] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.id, input.clientId))
    .limit(1);
  if (!clientRow) throw new ApiError("Client not found.", 404);

  const projectId = crypto.randomUUID();
  await db.insert(projects).values({
    id: projectId,
    organizationId,
    clientId: input.clientId,
    name: input.name.trim(),
    description: input.description ?? null,
    status: input.status ?? "active",
    priority: input.priority ?? null,
    startDate: input.startDate ? new Date(input.startDate) : null,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    budgetType: input.budgetType ?? null,
    budgetCents: input.budgetCents ?? null,
  });

  writeAuditLog({
    organizationId,
    actorUserId: null,
    action: "project.created",
    entityType: "project",
    entityId: projectId,
    metadata: { name: input.name, source: "api_v1" },
  }).catch(console.error);

  dispatchWebhookEvent(organizationId, "project.created", {
    projectId,
    name: input.name,
    clientId: input.clientId,
  }).catch(console.error);

  return { projectId };
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type CreateTaskV1Input = {
  title: string;
  projectId: string;
  description?: string | null;
  status?: string;
  priority?: string | null;
  assigneeUserId?: string | null;
  dueDate?: string | null;
  estimateMinutes?: number | null;
  tags?: string[];
};

export async function createTaskV1(organizationId: string, input: CreateTaskV1Input) {
  if (!input.title?.trim()) throw new ApiError("`title` is required.", 422);
  if (!input.projectId) throw new ApiError("`projectId` is required.", 422);

  const [projectRow] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, input.projectId))
    .limit(1);
  if (!projectRow) throw new ApiError("Project not found.", 404);

  // Tasks need a column - default to the org's first column.
  const [defaultColumn] = await db
    .select({ id: taskBoardColumns.id })
    .from(taskBoardColumns)
    .where(eq(taskBoardColumns.organizationId, organizationId))
    .orderBy(taskBoardColumns.position)
    .limit(1);

  const taskId = crypto.randomUUID();
  await db.insert(tasks).values({
    id: taskId,
    organizationId,
    projectId: input.projectId,
    columnId: defaultColumn?.id ?? null,
    title: input.title.trim(),
    description: input.description ?? null,
    status: input.status ?? "todo",
    priority: input.priority ?? null,
    assigneeUserId: input.assigneeUserId ?? null,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    estimateMinutes: input.estimateMinutes ?? null,
    estimateSetAt: input.estimateMinutes != null ? new Date() : null,
    tags: input.tags ?? [],
  });

  writeAuditLog({
    organizationId,
    actorUserId: null,
    action: "task.created",
    entityType: "task",
    entityId: taskId,
    metadata: { title: input.title, projectId: input.projectId, source: "api_v1" },
  }).catch(console.error);

  dispatchWebhookEvent(organizationId, "task.created", {
    taskId,
    title: input.title,
    projectId: input.projectId,
  }).catch(console.error);

  return { taskId };
}
