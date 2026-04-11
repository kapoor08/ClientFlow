import "server-only";

import { writeAuditLog } from "@/lib/audit";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatch";
import { and, asc, count, desc, eq, gte, ilike, isNull, lte, or, sql } from "drizzle-orm";
import { clients, projects } from "@/db/schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { dispatchNotification, getOrgMemberUserIds } from "@/lib/notifications";
import { enforceProjectCap } from "@/lib/plan-enforcement";
import {
  DEFAULT_PAGE_SIZE,
  buildPaginationMeta,
  paginationOffset,
  type PaginationMeta,
} from "@/lib/pagination";
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_PRIORITY_OPTIONS,
  type ProjectFormValues,
  type ProjectStatus,
  type ProjectPriority,
  type ProjectBudgetType,
} from "@/lib/projects-shared";

export type ProjectModuleAccess = {
  organizationId: string;
  organizationName: string;
  roleKey: string | null;
  canWrite: boolean;
};

export type ProjectListItem = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  status: ProjectStatus;
  priority: ProjectPriority | null;
  startDate: Date | null;
  dueDate: Date | null;
  taskCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectDetail = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority | null;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  budgetType: ProjectBudgetType | null;
  budgetCents: number | null;
  createdAt: Date;
  updatedAt: Date;
};

const SORTABLE_COLUMNS = {
  name: projects.name,
  status: projects.status,
  priority: projects.priority,
  dueDate: projects.dueDate,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
} as const;

type SortKey = keyof typeof SORTABLE_COLUMNS;

type ListProjectsOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
  clientId?: string;
  status?: string;
  priority?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

function createId() {
  return crypto.randomUUID();
}

function resolveSort(sort: string | undefined, order: "asc" | "desc") {
  const col =
    SORTABLE_COLUMNS[
      (sort as SortKey) in SORTABLE_COLUMNS ? (sort as SortKey) : "updatedAt"
    ];
  return order === "asc" ? asc(col) : desc(col);
}

function parseBudgetToCents(budget: string): number | null {
  if (!budget.trim()) return null;
  const dollars = parseFloat(budget);
  if (isNaN(dollars) || dollars < 0) return null;
  return Math.round(dollars * 100);
}

function formatBudgetFromCents(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toFixed(2);
}

export async function getProjectModuleAccessForUser(
  userId: string,
): Promise<ProjectModuleAccess | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;
  return {
    organizationId: context.organizationId,
    organizationName: context.organizationName,
    roleKey: context.roleKey,
    canWrite: context.roleKey !== "client",
  };
}

export async function listProjectsForUser(
  userId: string,
  options: ListProjectsOptions = {},
): Promise<{
  access: ProjectModuleAccess | null;
  projects: ProjectListItem[];
  pagination: PaginationMeta;
}> {
  const access = await getProjectModuleAccessForUser(userId);
  const emptyPagination = buildPaginationMeta(0, 1, DEFAULT_PAGE_SIZE);

  if (!access) {
    return { access: null, projects: [], pagination: emptyPagination };
  }

  const {
    query = "",
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    sort,
    order = "desc",
    clientId,
    status,
    priority,
    dateFrom,
    dateTo,
  } = options;

  const trimmedQuery = query.trim();

  const whereClause = and(
    eq(projects.organizationId, access.organizationId),
    isNull(projects.deletedAt),
    clientId ? eq(projects.clientId, clientId) : undefined,
    trimmedQuery
      ? or(
          ilike(projects.name, `%${trimmedQuery}%`),
          ilike(clients.name, `%${trimmedQuery}%`),
        )
      : undefined,
    status ? eq(projects.status, status) : undefined,
    priority ? eq(projects.priority, priority) : undefined,
    dateFrom ? gte(projects.startDate, dateFrom) : undefined,
    dateTo ? lte(projects.startDate, dateTo) : undefined,
  );

  const [totalResult, rows] = await Promise.all([
    db
      .select({ total: count(projects.id) })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(whereClause),
    db
      .select({
        id: projects.id,
        name: projects.name,
        clientId: projects.clientId,
        clientName: clients.name,
        status: projects.status,
        priority: projects.priority,
        startDate: projects.startDate,
        dueDate: projects.dueDate,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        taskCount: sql<number>`(
          SELECT COUNT(*) FROM tasks
          WHERE tasks.project_id = ${projects.id}
            AND tasks.deleted_at IS NULL
            AND tasks.parent_task_id IS NULL
        )`,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(whereClause)
      .orderBy(resolveSort(sort, order), asc(projects.name))
      .limit(pageSize)
      .offset(paginationOffset(page, pageSize)),
  ]);

  const total = totalResult[0]?.total ?? 0;
  const pagination = buildPaginationMeta(total, page, pageSize);

  return {
    access,
    projects: rows.map((p) => ({
      ...p,
      clientName: p.clientName ?? "Unknown Client",
      status: p.status as ProjectStatus,
      priority: p.priority as ProjectPriority | null,
      taskCount: Number(p.taskCount ?? 0),
    })),
    pagination,
  };
}

export async function getProjectDetailForUser(
  userId: string,
  projectId: string,
) {
  const access = await getProjectModuleAccessForUser(userId);

  if (!access) {
    return { access: null, project: null };
  }

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientId: projects.clientId,
      clientName: clients.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      startDate: projects.startDate,
      dueDate: projects.dueDate,
      completedAt: projects.completedAt,
      budgetType: projects.budgetType,
      budgetCents: projects.budgetCents,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(
      and(
        eq(projects.organizationId, access.organizationId),
        eq(projects.id, projectId),
        isNull(projects.deletedAt),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return { access, project: null };

  return {
    access,
    project: {
      ...row,
      clientName: row.clientName ?? "Unknown Client",
      status: row.status as ProjectStatus,
      priority: row.priority as ProjectPriority | null,
      budgetType: row.budgetType as ProjectBudgetType | null,
    } satisfies ProjectDetail,
  };
}

export async function getProjectForEditForUser(
  userId: string,
  projectId: string,
) {
  const detail = await getProjectDetailForUser(userId, projectId);

  if (!detail.access || !detail.project) {
    return { access: detail.access, project: null };
  }

  const p = detail.project;

  return {
    access: detail.access,
    project: {
      id: p.id,
      values: {
        name: p.name,
        clientId: p.clientId,
        description: p.description ?? "",
        status: p.status,
        priority: p.priority ?? "medium",
        startDate: p.startDate,
        dueDate: p.dueDate,
        budgetType: p.budgetType ?? "",
        budget: formatBudgetFromCents(p.budgetCents),
      } satisfies ProjectFormValues,
    },
  };
}

export async function createProjectForUser(
  userId: string,
  input: ProjectFormValues,
) {
  const access = await getProjectModuleAccessForUser(userId);

  if (!access) {
    throw new Error("No active organization was found for this account.");
  }
  if (!access.canWrite) {
    throw new Error("You do not have permission to create projects.");
  }

  await enforceProjectCap(access.organizationId);

  if (!PROJECT_STATUS_OPTIONS.some((o) => o.value === input.status)) {
    throw new Error("Select a valid project status.");
  }

  const projectId = createId();

  await db.insert(projects).values({
    id: projectId,
    organizationId: access.organizationId,
    clientId: input.clientId,
    name: input.name.trim(),
    description: input.description.trim() || null,
    status: input.status,
    priority: input.priority || null,
    startDate: input.startDate,
    dueDate: input.dueDate,
    budgetType: input.budgetType || null,
    budgetCents: parseBudgetToCents(input.budget ?? ""),
    createdByUserId: userId,
  });

  writeAuditLog({
    organizationId: access.organizationId,
    actorUserId: userId,
    action: "project.created",
    entityType: "project",
    entityId: projectId,
    metadata: { name: input.name.trim() },
  }).catch(console.error);

  // ─── Webhook dispatch ─────────────────────────────────────────────────────
  dispatchWebhookEvent(access.organizationId, "project.created", {
    projectId,
    name: input.name.trim(),
    status: input.status,
    clientId: input.clientId ?? null,
  }).catch(console.error);

  // Notify all org members about the new project (awaited so notification is in DB before response)
  const memberIdsForCreate = await getOrgMemberUserIds(access.organizationId);
  await dispatchNotification({
    organizationId: access.organizationId,
    recipientUserIds: memberIdsForCreate,
    eventKey: "project_created",
    title: `New project created: "${input.name.trim()}"`,
    url: `/projects/${projectId}`,
  });

  return { projectId, access };
}

export async function updateProjectForUser(
  userId: string,
  projectId: string,
  input: ProjectFormValues,
) {
  const access = await getProjectModuleAccessForUser(userId);

  if (!access) {
    throw new Error("No active organization was found for this account.");
  }
  if (!access.canWrite) {
    throw new Error("You do not have permission to update projects.");
  }

  const existing = await db
    .select({ id: projects.id, name: projects.name, status: projects.status, priority: projects.priority })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, access.organizationId),
        eq(projects.id, projectId),
        isNull(projects.deletedAt),
      ),
    )
    .limit(1);

  if (!existing[0]) {
    throw new Error("Project not found.");
  }

  await db
    .update(projects)
    .set({
      clientId: input.clientId,
      name: input.name.trim(),
      description: input.description.trim() || null,
      status: input.status,
      priority: input.priority || null,
      startDate: input.startDate,
      dueDate: input.dueDate,
      budgetType: input.budgetType || null,
      budgetCents: parseBudgetToCents(input.budget ?? ""),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  const projectChangedMeta: Record<string, unknown> = { name: input.name.trim() };
  if (existing[0].status !== input.status) projectChangedMeta.status = input.status;
  if ((existing[0].priority ?? null) !== (input.priority || null))
    projectChangedMeta.priority = input.priority || "None";

  writeAuditLog({
    organizationId: access.organizationId,
    actorUserId: userId,
    action: "project.updated",
    entityType: "project",
    entityId: projectId,
    metadata: projectChangedMeta,
  }).catch(console.error);

  dispatchWebhookEvent(access.organizationId, "project.updated", {
    projectId,
    name: input.name.trim(),
    status: input.status,
    priority: input.priority || null,
    clientId: input.clientId,
  }).catch(console.error);

  // Determine the most specific event key based on what changed
  const eventKey =
    input.status === "completed"
      ? "project_completed"
      : ("project_updated" as const);

  // Notify all org members about the update (awaited so notification is in DB before response)
  const memberIdsForUpdate = await getOrgMemberUserIds(access.organizationId);
  await dispatchNotification({
    organizationId: access.organizationId,
    recipientUserIds: memberIdsForUpdate,
    eventKey,
    title:
      eventKey === "project_completed"
        ? `Project completed: "${input.name.trim()}"`
        : `Project updated: "${input.name.trim()}"`,
    body: input.budgetType ? `Billing model: ${input.budgetType}` : undefined,
    url: `/projects/${projectId}`,
  });

  return { projectId, access };
}

export async function deleteProjectForUser(userId: string, projectId: string) {
  const access = await getProjectModuleAccessForUser(userId);

  if (!access) {
    throw new Error("No active organization was found for this account.");
  }
  if (!access.canWrite) {
    throw new Error("You do not have permission to delete projects.");
  }

  const existing = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, access.organizationId),
        eq(projects.id, projectId),
        isNull(projects.deletedAt),
      ),
    )
    .limit(1);

  if (!existing[0]) {
    throw new Error("Project not found.");
  }

  await db
    .update(projects)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  writeAuditLog({
    organizationId: access.organizationId,
    actorUserId: userId,
    action: "project.deleted",
    entityType: "project",
    entityId: projectId,
    metadata: { name: existing[0].name },
  }).catch(console.error);

  dispatchWebhookEvent(access.organizationId, "project.deleted", {
    projectId,
    name: existing[0].name,
  }).catch(console.error);
}
