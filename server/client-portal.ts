import "server-only";

import { and, count, desc, eq, isNull, isNotNull, lt, not, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { clients, invoices, projectFiles as projectFilesTable, projects, tasks } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";

const DONE_STATUSES = ["done", "completed"] as const;
const TERMINAL_PROJECT_STATUSES = ["completed", "cancelled"] as const;

// ── Types ──────────────────────────────────────────────────────────────────────

export type PortalClient = {
  id: string;
  name: string;
};

export type PortalProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  clientName: string | null;
};

export type PortalTask = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  dueDate: Date | null;
  projectName: string | null;
};

export type PortalFile = {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  storageUrl: string;
  projectName: string | null;
  createdAt: Date;
};

export type PortalHomeSummary = {
  orgName: string;
  clientName: string | null;
  totalProjects: number;
  activeProjects: number;
  openTasks: number;
  overdueTasks: number;
  totalFiles: number;
  recentProjects: PortalProject[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Find the client record whose contactEmail matches the logged-in user's email. */
async function findLinkedClientId(
  orgId: string,
  userEmail: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, orgId),
        eq(clients.contactEmail, userEmail),
        isNull(clients.deletedAt),
      ),
    )
    .limit(1);

  return row?.id ?? null;
}

/** Scope projects to the linked client record. Returns no rows when no client record is linked. */
function projectFilter(orgId: string, clientId: string | null) {
  if (!clientId) {
    // No client record linked to this user's email - show nothing rather than leaking all org data
    return sql`false`;
  }
  return and(
    eq(projects.organizationId, orgId),
    eq(projects.clientId, clientId),
    isNull(projects.deletedAt),
  );
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getPortalHomeForUser(
  userId: string,
): Promise<PortalHomeSummary | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const orgId = context.organizationId;

  const [userRow] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userRow) return null;

  const clientId = await findLinkedClientId(orgId, userRow.email);

  // Fetch client name if we found a match
  let clientName: string | null = null;
  if (clientId) {
    const [clientRow] = await db
      .select({ name: clients.name })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    clientName = clientRow?.name ?? null;
  }

  const filter = projectFilter(orgId, clientId);
  const now = new Date();

  const [
    totalProjectRows,
    activeProjectRows,
    openTaskRows,
    overdueTaskRows,
    totalFileRows,
    recentProjectRows,
  ] = await Promise.all([
    db.select({ value: count(projects.id) }).from(projects).where(filter),

    db
      .select({ value: count(projects.id) })
      .from(projects)
      .where(
        and(filter, not(inArray(projects.status, TERMINAL_PROJECT_STATUSES))),
      ),

    db
      .select({ value: count(tasks.id) })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          filter,
          isNull(tasks.deletedAt),
          not(inArray(tasks.status, DONE_STATUSES)),
        ),
      ),

    db
      .select({ value: count(tasks.id) })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          filter,
          isNull(tasks.deletedAt),
          not(inArray(tasks.status, DONE_STATUSES)),
          isNotNull(tasks.dueDate),
          lt(tasks.dueDate, now),
        ),
      ),

    db
      .select({ value: count(projectFilesTable.id) })
      .from(projectFilesTable)
      .innerJoin(projects, eq(projectFilesTable.projectId, projects.id))
      .where(filter),

    db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        priority: projects.priority,
        startDate: projects.startDate,
        dueDate: projects.dueDate,
        clientName: clients.name,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(filter)
      .orderBy(desc(projects.updatedAt))
      .limit(5),
  ]);

  return {
    orgName: context.organizationName,
    clientName,
    totalProjects: totalProjectRows[0]?.value ?? 0,
    activeProjects: activeProjectRows[0]?.value ?? 0,
    openTasks: openTaskRows[0]?.value ?? 0,
    overdueTasks: overdueTaskRows[0]?.value ?? 0,
    totalFiles: totalFileRows[0]?.value ?? 0,
    recentProjects: recentProjectRows,
  };
}

export async function getPortalProjectsForUser(
  userId: string,
): Promise<PortalProject[] | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const orgId = context.organizationId;
  const [userRow] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!userRow) return null;

  const clientId = await findLinkedClientId(orgId, userRow.email);
  const filter = projectFilter(orgId, clientId);

  return db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      startDate: projects.startDate,
      dueDate: projects.dueDate,
      clientName: clients.name,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(filter)
    .orderBy(desc(projects.updatedAt));
}

export async function getPortalProjectDetailForUser(
  userId: string,
  projectId: string,
): Promise<{
  project: PortalProject;
  tasks: PortalTask[];
  files: PortalFile[];
} | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const orgId = context.organizationId;
  const [userRow] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!userRow) return null;

  const clientId = await findLinkedClientId(orgId, userRow.email);
  const filter = projectFilter(orgId, clientId);

  const [projectRow] = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      startDate: projects.startDate,
      dueDate: projects.dueDate,
      clientName: clients.name,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(and(filter, eq(projects.id, projectId)))
    .limit(1);

  if (!projectRow) return null;

  const [projectTasks, projectFiles] = await Promise.all([
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(tasks.organizationId, orgId),
          eq(tasks.projectId, projectId),
          isNull(tasks.deletedAt),
        ),
      )
      .orderBy(tasks.status, tasks.dueDate),

    db
      .select({
        id: projectFilesTable.id,
        fileName: projectFilesTable.fileName,
        mimeType: projectFilesTable.mimeType,
        sizeBytes: projectFilesTable.sizeBytes,
        storageUrl: projectFilesTable.storageUrl,
        projectName: projects.name,
        createdAt: projectFilesTable.createdAt,
      })
      .from(projectFilesTable)
      .leftJoin(projects, eq(projectFilesTable.projectId, projects.id))
      .where(
        and(
          eq(projectFilesTable.organizationId, orgId),
          eq(projectFilesTable.projectId, projectId),
        ),
      )
      .orderBy(desc(projectFilesTable.createdAt)),
  ]);

  return { project: projectRow, tasks: projectTasks, files: projectFiles };
}

export async function getPortalTasksForUser(
  userId: string,
): Promise<PortalTask[] | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const orgId = context.organizationId;
  const [userRow] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!userRow) return null;

  const clientId = await findLinkedClientId(orgId, userRow.email);
  const filter = projectFilter(orgId, clientId);

  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      projectName: projects.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(filter, isNull(tasks.deletedAt)))
    .orderBy(tasks.status, desc(tasks.updatedAt));
}

export type PortalInvoice = {
  id: string;
  status: string;
  amountDueCents: number | null;
  amountPaidCents: number | null;
  currencyCode: string | null;
  invoiceUrl: string | null;
  dueAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
};

export async function getPortalInvoicesForUser(
  userId: string,
): Promise<PortalInvoice[] | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const orgId = context.organizationId;
  const [userRow] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!userRow) return null;

  const clientId = await findLinkedClientId(orgId, userRow.email);
  // No linked client - show nothing rather than leaking all org invoices
  if (!clientId) return [];

  return db
    .select({
      id: invoices.id,
      status: invoices.status,
      amountDueCents: invoices.amountDueCents,
      amountPaidCents: invoices.amountPaidCents,
      currencyCode: invoices.currencyCode,
      invoiceUrl: invoices.invoiceUrl,
      dueAt: invoices.dueAt,
      paidAt: invoices.paidAt,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, orgId),
        eq(invoices.clientId, clientId),
      ),
    )
    .orderBy(desc(invoices.createdAt));
}

export async function getPortalFilesForUser(
  userId: string,
): Promise<PortalFile[] | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const orgId = context.organizationId;
  const [userRow] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!userRow) return null;

  const clientId = await findLinkedClientId(orgId, userRow.email);
  const filter = projectFilter(orgId, clientId);

  return db
    .select({
      id: projectFilesTable.id,
      fileName: projectFilesTable.fileName,
      mimeType: projectFilesTable.mimeType,
      sizeBytes: projectFilesTable.sizeBytes,
      storageUrl: projectFilesTable.storageUrl,
      projectName: projects.name,
      createdAt: projectFilesTable.createdAt,
    })
    .from(projectFilesTable)
    .innerJoin(projects, eq(projectFilesTable.projectId, projects.id))
    .where(filter)
    .orderBy(desc(projectFilesTable.createdAt));
}
