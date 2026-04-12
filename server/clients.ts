import "server-only";

import { writeAuditLog } from "@/server/security/audit";
import { dispatchWebhookEvent } from "@/server/webhooks/dispatch";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
} from "drizzle-orm";
import { clients, projects } from "@/db/schema";
import { db } from "@/server/db/client";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import {
  DEFAULT_PAGE_SIZE,
  buildPaginationMeta,
  paginationOffset,
  type PaginationMeta,
} from "@/utils/pagination";
import {
  CLIENT_STATUS_OPTIONS,
  type ClientFormValues,
  type ClientStatus,
} from "@/schemas/clients";
import { enforceClientCap } from "@/server/subscription/plan-enforcement";
import { dispatchNotification, getOrgMemberUserIds } from "@/server/notifications/data";

export type ClientModuleAccess = {
  organizationId: string;
  organizationName: string;
  roleKey: string | null;
  canWrite: boolean;
};

export type ClientListItem = {
  id: string;
  name: string;
  company: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: ClientStatus;
  projectCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientDetail = {
  id: string;
  name: string;
  company: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: ClientStatus;
  notes: string | null;
  projectCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientLinkedProject = {
  id: string;
  name: string;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
};

const SORTABLE_COLUMNS = {
  name: clients.name,
  company: clients.company,
  status: clients.status,
  createdAt: clients.createdAt,
  updatedAt: clients.updatedAt,
} as const;

type SortKey = keyof typeof SORTABLE_COLUMNS;

type ListClientsOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

function createId() {
  return crypto.randomUUID();
}

function resolveSort(sort: string | undefined, order: "asc" | "desc") {
  const col =
    SORTABLE_COLUMNS[(sort as SortKey) in SORTABLE_COLUMNS ? (sort as SortKey) : "updatedAt"];
  return order === "asc" ? asc(col) : desc(col);
}

function normalizeClientInput(input: ClientFormValues): ClientFormValues {
  return {
    name: input.name.trim(),
    company: input.company.trim(),
    contactName: input.contactName.trim(),
    contactEmail: input.contactEmail.trim().toLowerCase(),
    contactPhone: input.contactPhone.trim(),
    status: input.status,
    notes: input.notes?.trim(),
  };
}

export async function getClientModuleAccessForUser(
  userId: string,
): Promise<ClientModuleAccess | null> {
  const context = await getOrganizationSettingsContextForUser(userId);

  if (!context) {
    return null;
  }

  return {
    organizationId: context.organizationId,
    organizationName: context.organizationName,
    roleKey: context.roleKey,
    canWrite: context.roleKey !== "client",
  };
}

export async function listClientsForUser(
  userId: string,
  options: ListClientsOptions = {},
): Promise<{
  access: ClientModuleAccess | null;
  clients: ClientListItem[];
  pagination: PaginationMeta;
}> {
  const access = await getClientModuleAccessForUser(userId);

  const emptyPagination = buildPaginationMeta(0, 1, DEFAULT_PAGE_SIZE);

  if (!access) {
    return { access: null, clients: [], pagination: emptyPagination };
  }

  const {
    query = "",
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    sort,
    order = "desc",
    status,
    dateFrom,
    dateTo,
  } = options;

  const trimmedQuery = query.trim();

  const whereClause = and(
    eq(clients.organizationId, access.organizationId),
    isNull(clients.deletedAt),
    trimmedQuery
      ? or(
          ilike(clients.name, `%${trimmedQuery}%`),
          ilike(clients.company, `%${trimmedQuery}%`),
          ilike(clients.contactName, `%${trimmedQuery}%`),
          ilike(clients.contactEmail, `%${trimmedQuery}%`),
        )
      : undefined,
    status ? eq(clients.status, status) : undefined,
    dateFrom ? gte(clients.createdAt, dateFrom) : undefined,
    dateTo ? lte(clients.createdAt, dateTo) : undefined,
  );

  const [totalResult, rows] = await Promise.all([
    db
      .select({ total: count(clients.id) })
      .from(clients)
      .where(whereClause),
    db
      .select({
        id: clients.id,
        name: clients.name,
        company: clients.company,
        contactName: clients.contactName,
        contactEmail: clients.contactEmail,
        contactPhone: clients.contactPhone,
        status: clients.status,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
      })
      .from(clients)
      .where(whereClause)
      .orderBy(resolveSort(sort, order), asc(clients.name))
      .limit(pageSize)
      .offset(paginationOffset(page, pageSize)),
  ]);

  const total = totalResult[0]?.total ?? 0;
  const pagination = buildPaginationMeta(total, page, pageSize);

  const clientIds = rows.map((c) => c.id);
  const countsByClientId = new Map<string, number>();

  if (clientIds.length > 0) {
    const projectCounts = await db
      .select({
        clientId: projects.clientId,
        projectCount: count(projects.id),
      })
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, access.organizationId),
          inArray(projects.clientId, clientIds),
          isNull(projects.deletedAt),
        ),
      )
      .groupBy(projects.clientId);

    for (const row of projectCounts) {
      countsByClientId.set(row.clientId, row.projectCount);
    }
  }

  return {
    access,
    clients: rows.map((c) => ({
      ...c,
      status: c.status as ClientStatus,
      projectCount: countsByClientId.get(c.id) ?? 0,
    })),
    pagination,
  };
}

export async function getClientDetailForUser(userId: string, clientId: string) {
  const access = await getClientModuleAccessForUser(userId);

  if (!access) {
    return {
      access: null,
      client: null,
      linkedProjects: [] as ClientLinkedProject[],
    };
  }

  const clientRows = await db
    .select({
      id: clients.id,
      name: clients.name,
      company: clients.company,
      contactName: clients.contactName,
      contactEmail: clients.contactEmail,
      contactPhone: clients.contactPhone,
      status: clients.status,
      notes: clients.notes,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
    })
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, access.organizationId),
        eq(clients.id, clientId),
        isNull(clients.deletedAt),
      ),
    )
    .limit(1);

  const clientRow = clientRows[0];

  if (!clientRow) {
    return {
      access,
      client: null,
      linkedProjects: [] as ClientLinkedProject[],
    };
  }

  const linkedProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      dueDate: projects.dueDate,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, access.organizationId),
        eq(projects.clientId, clientId),
        isNull(projects.deletedAt),
      ),
    )
    .orderBy(desc(projects.updatedAt), asc(projects.name));

  return {
    access,
    client: {
      ...clientRow,
      status: clientRow.status as ClientStatus,
      projectCount: linkedProjects.length,
    } satisfies ClientDetail,
    linkedProjects,
  };
}

export async function getClientForEditForUser(userId: string, clientId: string) {
  const detail = await getClientDetailForUser(userId, clientId);

  if (!detail.access || !detail.client) {
    return { access: detail.access, client: null };
  }

  return {
    access: detail.access,
    client: {
      id: detail.client.id,
      values: {
        name: detail.client.name,
        company: detail.client.company ?? "",
        contactName: detail.client.contactName ?? "",
        contactEmail: detail.client.contactEmail ?? "",
        contactPhone: detail.client.contactPhone ?? "",
        status: detail.client.status,
        notes: detail.client.notes ?? "",
      } satisfies ClientFormValues,
    },
  };
}

export async function createClientForUser(
  userId: string,
  input: ClientFormValues,
) {
  const access = await getClientModuleAccessForUser(userId);

  if (!access) {
    throw new Error("No active organization was found for this account.");
  }

  if (!access.canWrite) {
    throw new Error("You do not have permission to create clients.");
  }

  await enforceClientCap(access.organizationId);

  const values = normalizeClientInput(input);

  if (!values.name) {
    throw new Error("Client name is required.");
  }

  if (!CLIENT_STATUS_OPTIONS.some((o) => o.value === values.status)) {
    throw new Error("Select a valid client status.");
  }

  const clientId = createId();

  await db.insert(clients).values({
    id: clientId,
    organizationId: access.organizationId,
    name: values.name,
    company: values.company || null,
    contactName: values.contactName || null,
    contactEmail: values.contactEmail || null,
    contactPhone: values.contactPhone || null,
    status: values.status,
    notes: values.notes || null,
    createdByUserId: userId,
  });

  writeAuditLog({
    organizationId: access.organizationId,
    actorUserId: userId,
    action: "client.created",
    entityType: "client",
    entityId: clientId,
    metadata: { name: values.name },
  }).catch(console.error);

  // ─── Webhook dispatch ─────────────────────────────────────────────────────
  dispatchWebhookEvent(access.organizationId, "client.created", {
    clientId,
    name: values.name,
    status: values.status,
  }).catch(console.error);

  // Notify all org members about the new client
  const memberIdsForCreate = await getOrgMemberUserIds(access.organizationId);
  await dispatchNotification({
    organizationId: access.organizationId,
    recipientUserIds: memberIdsForCreate,
    eventKey: "client_created",
    title: `New client added: "${values.name}"`,
    url: `/clients/${clientId}`,
  });

  return { clientId, access };
}

export async function updateClientForUser(
  userId: string,
  clientId: string,
  input: ClientFormValues,
) {
  const access = await getClientModuleAccessForUser(userId);

  if (!access) {
    throw new Error("No active organization was found for this account.");
  }

  if (!access.canWrite) {
    throw new Error("You do not have permission to update clients.");
  }

  const existing = await db
    .select({ id: clients.id, name: clients.name, status: clients.status, company: clients.company })
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, access.organizationId),
        eq(clients.id, clientId),
        isNull(clients.deletedAt),
      ),
    )
    .limit(1);

  if (!existing[0]) {
    throw new Error("Client not found.");
  }

  const values = normalizeClientInput(input);

  if (!values.name) {
    throw new Error("Client name is required.");
  }

  if (!CLIENT_STATUS_OPTIONS.some((o) => o.value === values.status)) {
    throw new Error("Select a valid client status.");
  }

  await db
    .update(clients)
    .set({
      name: values.name,
      company: values.company || null,
      contactName: values.contactName || null,
      contactEmail: values.contactEmail || null,
      contactPhone: values.contactPhone || null,
      status: values.status,
      notes: values.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId));

  const clientChangedMeta: Record<string, unknown> = { name: values.name };
  if (existing[0].status !== values.status) clientChangedMeta.status = values.status;
  if ((existing[0].company || "") !== (values.company || ""))
    clientChangedMeta.company = values.company || null;

  writeAuditLog({
    organizationId: access.organizationId,
    actorUserId: userId,
    action: "client.updated",
    entityType: "client",
    entityId: clientId,
    metadata: clientChangedMeta,
  }).catch(console.error);

  dispatchWebhookEvent(access.organizationId, "client.updated", {
    clientId,
    name: values.name,
    status: values.status,
  }).catch(console.error);

  // Notify org members about status changes
  const memberIdsForUpdate = await getOrgMemberUserIds(access.organizationId);
  await dispatchNotification({
    organizationId: access.organizationId,
    recipientUserIds: memberIdsForUpdate,
    eventKey: "client_status_changed",
    title: `Client updated: "${values.name}"`,
    url: `/clients/${clientId}`,
  });

  return { clientId, access };
}

export async function deleteClientForUser(userId: string, clientId: string) {
  const access = await getClientModuleAccessForUser(userId);

  if (!access) {
    throw new Error("No active organization was found for this account.");
  }

  if (!access.canWrite) {
    throw new Error("You do not have permission to delete clients.");
  }

  const existing = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, access.organizationId),
        eq(clients.id, clientId),
        isNull(clients.deletedAt),
      ),
    )
    .limit(1);

  if (!existing[0]) {
    throw new Error("Client not found.");
  }

  await db
    .update(clients)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(clients.id, clientId));

  writeAuditLog({
    organizationId: access.organizationId,
    actorUserId: userId,
    action: "client.deleted",
    entityType: "client",
    entityId: clientId,
    metadata: { name: existing[0].name },
  }).catch(console.error);
}
