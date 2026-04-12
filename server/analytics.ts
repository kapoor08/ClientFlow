import "server-only";

import { and, count, desc, eq, gt, gte, isNull, lt, lte, ne, sql, sum } from "drizzle-orm";
import { clients, invoices, projectFiles, projects, tasks, timeEntries } from "@/db/schema";
import { db } from "@/server/db/client";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";

export type ProjectStatusBreakdown = {
  status: string;
  total: number;
};

export type MonthlyCount = {
  month: string;
  total: number;
};

export type MonthlyRevenue = {
  month: string;
  totalCents: number;
};

export type RecentProject = {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  dueDate: Date | null;
  updatedAt: Date;
};

export type AnalyticsSummary = {
  // Projects
  totalClients: number;
  activeProjects: number;
  completedProjects: number;
  totalFiles: number;
  // Tasks
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: ProjectStatusBreakdown[];
  // Time
  totalHoursLogged: number;
  monthlyHoursLogged: MonthlyCount[];
  // Revenue
  totalRevenueCents: number;
  pendingRevenueCents: number;
  invoicesByStatus: ProjectStatusBreakdown[];
  // Charts
  projectsByStatus: ProjectStatusBreakdown[];
  monthlyProjectCreation: MonthlyCount[];
  monthlyRevenue: MonthlyRevenue[];
  // Lists
  recentProjects: RecentProject[];
};

export type AnalyticsOptions = {
  dateFrom?: Date;
  dateTo?: Date;
  clientId?: string;
  priority?: string;
};

export async function getAnalyticsSummaryForUser(
  userId: string,
  options: AnalyticsOptions = {},
): Promise<AnalyticsSummary | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const orgId = context.organizationId;
  const { dateFrom, dateTo, clientId, priority } = options;

  const now = new Date();

  // ─── Shared predicates ────────────────────────────────────────────────────────

  const projectBase = and(
    eq(projects.organizationId, orgId),
    isNull(projects.deletedAt),
    clientId ? eq(projects.clientId, clientId) : undefined,
    priority ? eq(projects.priority, priority) : undefined,
    dateFrom ? gte(projects.createdAt, dateFrom) : undefined,
    dateTo ? lte(projects.createdAt, dateTo) : undefined,
  );

  // Tasks require a join to projects for clientId/priority filter
  const taskBase = and(
    eq(tasks.organizationId, orgId),
    isNull(tasks.deletedAt),
    clientId || priority
      ? undefined // handled via join below where needed
      : undefined,
    dateFrom ? gte(tasks.createdAt, dateFrom) : undefined,
    dateTo ? lte(tasks.createdAt, dateTo) : undefined,
  );

  // Task base with project join applied inline per query
  const taskProjectFilter =
    clientId || priority
      ? and(
          eq(tasks.organizationId, orgId),
          isNull(tasks.deletedAt),
          dateFrom ? gte(tasks.createdAt, dateFrom) : undefined,
          dateTo ? lte(tasks.createdAt, dateTo) : undefined,
        )
      : taskBase;

  const invoiceBase = and(
    eq(invoices.organizationId, orgId),
    clientId ? eq(invoices.clientId, clientId) : undefined,
    dateFrom ? gte(invoices.createdAt, dateFrom) : undefined,
    dateTo ? lte(invoices.createdAt, dateTo) : undefined,
  );

  const timeBase = and(
    eq(timeEntries.organizationId, orgId),
    clientId || priority
      ? undefined
      : and(
          dateFrom ? gte(timeEntries.loggedAt, dateFrom) : undefined,
          dateTo ? lte(timeEntries.loggedAt, dateTo) : undefined,
        ),
  );

  // ─── Helper: build task query (with optional project join for client/priority) ─

  function withProjectJoin<T>(
    baseQuery: Parameters<typeof db.select>[0],
  ) {
    // Used in task queries when clientId or priority filter is active
    return clientId || priority;
  }

  // ─── All queries in parallel ──────────────────────────────────────────────────

  const [
    clientsResult,
    activeProjectsResult,
    completedProjectsResult,
    totalFilesResult,
    byStatusResult,
    monthlyResult,
    recentProjectsResult,
    totalRevenueResult,
    monthlyRevenueResult,
    // Tasks
    totalTasksResult,
    completedTasksResult,
    overdueTasksResult,
    tasksByStatusResult,
    // Time
    totalHoursResult,
    monthlyHoursResult,
    // Pending revenue
    pendingRevenueResult,
    invoicesByStatusResult,
  ] = await Promise.all([
    // ─── Clients ───────────────────────────────────────────────────────────────
    db
      .select({ total: count() })
      .from(clients)
      .where(
        and(
          eq(clients.organizationId, orgId),
          eq(clients.status, "active"),
          isNull(clients.deletedAt),
          clientId ? eq(clients.id, clientId) : undefined,
        ),
      ),

    // ─── Active projects ───────────────────────────────────────────────────────
    db
      .select({ total: count() })
      .from(projects)
      .where(and(projectBase, eq(projects.status, "in_progress"))),

    // ─── Completed projects ────────────────────────────────────────────────────
    db
      .select({ total: count() })
      .from(projects)
      .where(and(projectBase, eq(projects.status, "completed"))),

    // ─── Files ────────────────────────────────────────────────────────────────
    clientId
      ? db
          .select({ total: count() })
          .from(projectFiles)
          .innerJoin(projects, eq(projectFiles.projectId, projects.id))
          .where(
            and(
              eq(projectFiles.organizationId, orgId),
              eq(projects.clientId, clientId),
              dateFrom ? gte(projectFiles.createdAt, dateFrom) : undefined,
              dateTo ? lte(projectFiles.createdAt, dateTo) : undefined,
            ),
          )
      : db
          .select({ total: count() })
          .from(projectFiles)
          .where(
            and(
              eq(projectFiles.organizationId, orgId),
              dateFrom ? gte(projectFiles.createdAt, dateFrom) : undefined,
              dateTo ? lte(projectFiles.createdAt, dateTo) : undefined,
            ),
          ),

    // ─── Projects by status ────────────────────────────────────────────────────
    db
      .select({ status: projects.status, total: count() })
      .from(projects)
      .where(projectBase)
      .groupBy(projects.status),

    // ─── Monthly project creation ──────────────────────────────────────────────
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${projects.createdAt}), 'Mon YY')`,
        monthDate: sql<string>`date_trunc('month', ${projects.createdAt})`,
        total: count(),
      })
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, orgId),
          isNull(projects.deletedAt),
          clientId ? eq(projects.clientId, clientId) : undefined,
          priority ? eq(projects.priority, priority) : undefined,
          dateFrom ? gte(projects.createdAt, dateFrom) : undefined,
          dateTo ? lte(projects.createdAt, dateTo) : undefined,
        ),
      )
      .groupBy(sql`date_trunc('month', ${projects.createdAt})`)
      .orderBy(sql`date_trunc('month', ${projects.createdAt}) asc`),

    // ─── Recent projects ───────────────────────────────────────────────────────
    db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        priority: projects.priority,
        dueDate: projects.dueDate,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, orgId),
          isNull(projects.deletedAt),
          clientId ? eq(projects.clientId, clientId) : undefined,
          priority ? eq(projects.priority, priority) : undefined,
        ),
      )
      .orderBy(desc(projects.updatedAt))
      .limit(8),

    // ─── Total paid revenue ────────────────────────────────────────────────────
    db
      .select({ total: sum(invoices.amountPaidCents) })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, orgId),
          eq(invoices.status, "paid"),
          clientId ? eq(invoices.clientId, clientId) : undefined,
          dateFrom ? gte(invoices.paidAt, dateFrom) : undefined,
          dateTo ? lte(invoices.paidAt, dateTo) : undefined,
        ),
      ),

    // ─── Monthly revenue ───────────────────────────────────────────────────────
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${invoices.paidAt}), 'Mon YY')`,
        monthDate: sql<string>`date_trunc('month', ${invoices.paidAt})`,
        totalCents: sum(invoices.amountPaidCents),
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, orgId),
          eq(invoices.status, "paid"),
          clientId ? eq(invoices.clientId, clientId) : undefined,
          dateFrom ? gte(invoices.paidAt, dateFrom) : undefined,
          dateTo ? lte(invoices.paidAt, dateTo) : undefined,
        ),
      )
      .groupBy(sql`date_trunc('month', ${invoices.paidAt})`)
      .orderBy(sql`date_trunc('month', ${invoices.paidAt}) asc`),

    // ─── Total tasks ───────────────────────────────────────────────────────────
    clientId || priority
      ? db
          .select({ total: count() })
          .from(tasks)
          .innerJoin(projects, eq(tasks.projectId, projects.id))
          .where(
            and(
              taskProjectFilter,
              clientId ? eq(projects.clientId, clientId) : undefined,
              priority ? eq(projects.priority, priority) : undefined,
            ),
          )
      : db.select({ total: count() }).from(tasks).where(taskBase),

    // ─── Completed tasks ───────────────────────────────────────────────────────
    clientId || priority
      ? db
          .select({ total: count() })
          .from(tasks)
          .innerJoin(projects, eq(tasks.projectId, projects.id))
          .where(
            and(
              taskProjectFilter,
              eq(tasks.status, "done"),
              clientId ? eq(projects.clientId, clientId) : undefined,
              priority ? eq(projects.priority, priority) : undefined,
            ),
          )
      : db
          .select({ total: count() })
          .from(tasks)
          .where(and(taskBase, eq(tasks.status, "done"))),

    // ─── Overdue tasks (past due, not done) ────────────────────────────────────
    clientId || priority
      ? db
          .select({ total: count() })
          .from(tasks)
          .innerJoin(projects, eq(tasks.projectId, projects.id))
          .where(
            and(
              eq(tasks.organizationId, orgId),
              isNull(tasks.deletedAt),
              lt(tasks.dueDate, now),
              ne(tasks.status, "done"),
              clientId ? eq(projects.clientId, clientId) : undefined,
              priority ? eq(projects.priority, priority) : undefined,
            ),
          )
      : db
          .select({ total: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.organizationId, orgId),
              isNull(tasks.deletedAt),
              lt(tasks.dueDate, now),
              ne(tasks.status, "done"),
            ),
          ),

    // ─── Tasks by status ──────────────────────────────────────────────────────
    clientId || priority
      ? db
          .select({ status: tasks.status, total: count() })
          .from(tasks)
          .innerJoin(projects, eq(tasks.projectId, projects.id))
          .where(
            and(
              taskProjectFilter,
              clientId ? eq(projects.clientId, clientId) : undefined,
              priority ? eq(projects.priority, priority) : undefined,
            ),
          )
          .groupBy(tasks.status)
      : db
          .select({ status: tasks.status, total: count() })
          .from(tasks)
          .where(taskBase)
          .groupBy(tasks.status),

    // ─── Total hours logged ────────────────────────────────────────────────────
    clientId || priority
      ? db
          .select({ total: sum(timeEntries.minutes) })
          .from(timeEntries)
          .innerJoin(projects, eq(timeEntries.projectId, projects.id))
          .where(
            and(
              eq(timeEntries.organizationId, orgId),
              clientId ? eq(projects.clientId, clientId) : undefined,
              priority ? eq(projects.priority, priority) : undefined,
              dateFrom ? gte(timeEntries.loggedAt, dateFrom) : undefined,
              dateTo ? lte(timeEntries.loggedAt, dateTo) : undefined,
            ),
          )
      : db
          .select({ total: sum(timeEntries.minutes) })
          .from(timeEntries)
          .where(
            and(
              eq(timeEntries.organizationId, orgId),
              dateFrom ? gte(timeEntries.loggedAt, dateFrom) : undefined,
              dateTo ? lte(timeEntries.loggedAt, dateTo) : undefined,
            ),
          ),

    // ─── Monthly hours logged ─────────────────────────────────────────────────
    clientId || priority
      ? db
          .select({
            month: sql<string>`to_char(date_trunc('month', ${timeEntries.loggedAt}), 'Mon YY')`,
            monthDate: sql<string>`date_trunc('month', ${timeEntries.loggedAt})`,
            total: sql<number>`coalesce(sum(${timeEntries.minutes}), 0)`,
          })
          .from(timeEntries)
          .innerJoin(projects, eq(timeEntries.projectId, projects.id))
          .where(
            and(
              eq(timeEntries.organizationId, orgId),
              clientId ? eq(projects.clientId, clientId) : undefined,
              priority ? eq(projects.priority, priority) : undefined,
              dateFrom ? gte(timeEntries.loggedAt, dateFrom) : undefined,
              dateTo ? lte(timeEntries.loggedAt, dateTo) : undefined,
            ),
          )
          .groupBy(sql`date_trunc('month', ${timeEntries.loggedAt})`)
          .orderBy(sql`date_trunc('month', ${timeEntries.loggedAt}) asc`)
      : db
          .select({
            month: sql<string>`to_char(date_trunc('month', ${timeEntries.loggedAt}), 'Mon YY')`,
            monthDate: sql<string>`date_trunc('month', ${timeEntries.loggedAt})`,
            total: sql<number>`coalesce(sum(${timeEntries.minutes}), 0)`,
          })
          .from(timeEntries)
          .where(
            and(
              eq(timeEntries.organizationId, orgId),
              dateFrom ? gte(timeEntries.loggedAt, dateFrom) : undefined,
              dateTo ? lte(timeEntries.loggedAt, dateTo) : undefined,
            ),
          )
          .groupBy(sql`date_trunc('month', ${timeEntries.loggedAt})`)
          .orderBy(sql`date_trunc('month', ${timeEntries.loggedAt}) asc`),

    // ─── Pending revenue (sent / draft invoices) ──────────────────────────────
    db
      .select({ total: sum(invoices.amountDueCents) })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, orgId),
          clientId ? eq(invoices.clientId, clientId) : undefined,
          sql`${invoices.status} IN ('sent', 'draft')`,
        ),
      ),

    // ─── Invoices by status ───────────────────────────────────────────────────
    db
      .select({ status: invoices.status, total: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, orgId),
          clientId ? eq(invoices.clientId, clientId) : undefined,
          dateFrom ? gte(invoices.createdAt, dateFrom) : undefined,
          dateTo ? lte(invoices.createdAt, dateTo) : undefined,
        ),
      )
      .groupBy(invoices.status),
  ]);

  const totalMinutes = Number(totalHoursResult[0]?.total ?? 0);

  return {
    totalClients: clientsResult[0]?.total ?? 0,
    activeProjects: activeProjectsResult[0]?.total ?? 0,
    completedProjects: completedProjectsResult[0]?.total ?? 0,
    totalFiles: totalFilesResult[0]?.total ?? 0,
    totalTasks: totalTasksResult[0]?.total ?? 0,
    completedTasks: completedTasksResult[0]?.total ?? 0,
    overdueTasks: overdueTasksResult[0]?.total ?? 0,
    tasksByStatus: tasksByStatusResult.map((r) => ({
      status: r.status ?? "unknown",
      total: r.total,
    })),
    totalHoursLogged: Math.round(totalMinutes / 60),
    monthlyHoursLogged: monthlyHoursResult.map((r) => ({
      month: r.month,
      total: Math.round(Number(r.total) / 60),
    })),
    totalRevenueCents: Number(totalRevenueResult[0]?.total ?? 0),
    pendingRevenueCents: Number(pendingRevenueResult[0]?.total ?? 0),
    invoicesByStatus: invoicesByStatusResult.map((r) => ({
      status: r.status ?? "unknown",
      total: r.total,
    })),
    projectsByStatus: byStatusResult.map((r) => ({
      status: r.status ?? "unknown",
      total: r.total,
    })),
    monthlyProjectCreation: monthlyResult.map((r) => ({
      month: r.month,
      total: r.total,
    })),
    monthlyRevenue: monthlyRevenueResult.map((r) => ({
      month: r.month,
      totalCents: Number(r.totalCents ?? 0),
    })),
    recentProjects: recentProjectsResult,
  };
}
