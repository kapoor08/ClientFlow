import "server-only";

import { and, count, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { clients, projectFiles, projects } from "@/db/schema";
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
  projectsByStatus: ProjectStatusBreakdown[];
  monthlyProjectCreation: MonthlyCount[];
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

  // Default chart window: 6 months back from dateFrom (or now)
  const chartStart = dateFrom ?? new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 5,
    1,
  );

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
  ] = await Promise.all([
    // Total active clients — org-wide snapshot (no date/client filter)
    db
      .select({ total: count() })
      .from(clients)
      .where(
        and(
          eq(clients.organizationId, orgId),
          eq(clients.status, "active"),
          isNull(clients.deletedAt),
        ),
      ),

    // Active projects (active or in_progress) — respects all filters
    db
      .select({ total: count() })
      .from(projects)
      .where(and(projectBase, inArray(projects.status, ["active", "in_progress"]))),

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
          gte(projects.createdAt, chartStart),
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
  ]);

  return {
    totalClients: clientsResult[0]?.total ?? 0,
    activeProjects: activeProjectsResult[0]?.total ?? 0,
    completedProjects: completedProjectsResult[0]?.total ?? 0,
    totalFiles: totalFilesResult[0]?.total ?? 0,
    projectsByStatus: byStatusResult.map((r) => ({
      status: r.status ?? "unknown",
      total: r.total,
    })),
    monthlyProjectCreation: monthlyResult.map((r) => ({
      month: r.month,
      total: r.total,
    })),
    recentProjects: recentProjectsResult,
  };
}
