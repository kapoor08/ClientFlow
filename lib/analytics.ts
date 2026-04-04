import "server-only";

import { and, count, desc, eq, gte, isNull, lte, sql, sum } from "drizzle-orm";
import { clients, invoices, projectFiles, projects } from "@/db/schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";

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
  totalClients: number;
  activeProjects: number;
  completedProjects: number;
  totalFiles: number;
  totalRevenueCents: number;
  projectsByStatus: ProjectStatusBreakdown[];
  monthlyProjectCreation: MonthlyCount[];
  monthlyRevenue: MonthlyRevenue[];
  recentProjects: RecentProject[];
};

export type AnalyticsOptions = {
  dateFrom?: Date;
  dateTo?: Date;
  clientId?: string;
};

export async function getAnalyticsSummaryForUser(
  userId: string,
  options: AnalyticsOptions = {},
): Promise<AnalyticsSummary | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const orgId = context.organizationId;
  const { dateFrom, dateTo, clientId } = options;

  const chartStart = dateFrom;

  // Shared project filter predicates
  const projectBase = and(
    eq(projects.organizationId, orgId),
    isNull(projects.deletedAt),
    clientId ? eq(projects.clientId, clientId) : undefined,
    dateFrom ? gte(projects.createdAt, dateFrom) : undefined,
    dateTo ? lte(projects.createdAt, dateTo) : undefined,
  );

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
  ] = await Promise.all([
    // Total active clients — snapshot, scoped by client filter when selected
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

    // Active projects (in_progress) — respects all filters
    db
      .select({ total: count() })
      .from(projects)
      .where(and(projectBase, eq(projects.status, "in_progress"))),

    // Completed projects — respects all filters
    db
      .select({ total: count() })
      .from(projects)
      .where(and(projectBase, eq(projects.status, "completed"))),

    // Total files — respects date + clientId filters (join projects for clientId)
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

    // Projects by status — respects all filters
    db
      .select({ status: projects.status, total: count() })
      .from(projects)
      .where(projectBase)
      .groupBy(projects.status),

    // Monthly project creation trend
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
          chartStart ? gte(projects.createdAt, chartStart) : undefined,
          dateTo ? lte(projects.createdAt, dateTo) : undefined,
        ),
      )
      .groupBy(sql`date_trunc('month', ${projects.createdAt})`)
      .orderBy(sql`date_trunc('month', ${projects.createdAt}) asc`),

    // Recent projects — respects clientId filter, not date filter (want latest)
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
        ),
      )
      .orderBy(desc(projects.updatedAt))
      .limit(6),

    // Total revenue from paid invoices
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

    // Monthly revenue trend (paid invoices)
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
          chartStart ? gte(invoices.paidAt, chartStart) : undefined,
          dateTo ? lte(invoices.paidAt, dateTo) : undefined,
        ),
      )
      .groupBy(sql`date_trunc('month', ${invoices.paidAt})`)
      .orderBy(sql`date_trunc('month', ${invoices.paidAt}) asc`),
  ]);

  return {
    totalClients: clientsResult[0]?.total ?? 0,
    activeProjects: activeProjectsResult[0]?.total ?? 0,
    completedProjects: completedProjectsResult[0]?.total ?? 0,
    totalFiles: totalFilesResult[0]?.total ?? 0,
    totalRevenueCents: Number(totalRevenueResult[0]?.total ?? 0),
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
