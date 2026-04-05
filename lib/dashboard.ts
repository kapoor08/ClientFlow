import "server-only";

import {
  and,
  count,
  desc,
  eq,
  gte,
  isNull,
  lt,
  lte,
  not,
  inArray,
  sum,
  sql,
} from "drizzle-orm";
import { auditLogs, clients, invoices, projects, tasks } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";

export type DashboardTask = {
  id: string;
  title: string;
  projectName: string | null;
  status: string;
  priority: string | null;
  dueDate: Date | null;
};

export type DashboardProject = {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  dueDate: Date | null;
  clientName: string | null;
};

export type DashboardActivity = {
  id: string;
  action: string;
  entityType: string;
  actorName: string | null;
  createdAt: Date;
};

export type DashboardKPIs = {
  activeClients: number;
  newClientsThisMonth: number;
  projectsInProgress: number;
  projectsDueThisWeek: number;
  openTasks: number;
  overdueTasks: number;
  monthlyRevenueCents: number;
};

export type RevenueTrendPoint = {
  month: string;
  revenueCents: number;
};

export type DashboardContext = {
  userName: string | null;
  kpis: DashboardKPIs;
  revenueTrend: RevenueTrendPoint[];
  tasksDueSoon: DashboardTask[];
  recentProjects: DashboardProject[];
  recentActivity: DashboardActivity[];
};

const TERMINAL_PROJECT_STATUSES = ["completed", "cancelled"] as const;
const DONE_TASK_STATUSES = ["done", "completed"] as const;

export async function getDashboardContextForUser(
  userId: string,
): Promise<DashboardContext | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  const orgId = context.organizationId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [userRow] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const [
    activeClientRows,
    newClientRows,
    activeProjectRows,
    dueThisWeekRows,
    openTaskRows,
    overdueTaskRows,
    revenueRows,
    revenueTrendRows,
    tasksDueSoonRows,
    recentProjectRows,
    recentActivityRows,
  ] = await Promise.all([
    // Active clients
    db
      .select({ value: count(clients.id) })
      .from(clients)
      .where(
        and(
          eq(clients.organizationId, orgId),
          eq(clients.status, "active"),
          isNull(clients.deletedAt),
        ),
      ),

    // New clients created this calendar month
    db
      .select({ value: count(clients.id) })
      .from(clients)
      .where(
        and(
          eq(clients.organizationId, orgId),
          isNull(clients.deletedAt),
          gte(clients.createdAt, monthStart),
        ),
      ),

    // Projects not in a terminal status
    db
      .select({ value: count(projects.id) })
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, orgId),
          isNull(projects.deletedAt),
          not(inArray(projects.status, TERMINAL_PROJECT_STATUSES)),
        ),
      ),

    // Active projects with a due date in the next 7 days
    db
      .select({ value: count(projects.id) })
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, orgId),
          isNull(projects.deletedAt),
          not(inArray(projects.status, TERMINAL_PROJECT_STATUSES)),
          gte(projects.dueDate, now),
          lte(projects.dueDate, sevenDaysFromNow),
        ),
      ),

    // Open tasks (not done/completed)
    db
      .select({ value: count(tasks.id) })
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, orgId),
          isNull(tasks.deletedAt),
          not(inArray(tasks.status, DONE_TASK_STATUSES)),
        ),
      ),

    // Overdue tasks (due date in the past, not done)
    db
      .select({ value: count(tasks.id) })
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, orgId),
          isNull(tasks.deletedAt),
          not(inArray(tasks.status, DONE_TASK_STATUSES)),
          lt(tasks.dueDate, now),
        ),
      ),

    // Revenue from invoices paid this calendar month
    db
      .select({ value: sum(invoices.amountPaidCents) })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, orgId),
          eq(invoices.status, "paid"),
          gte(invoices.paidAt, monthStart),
        ),
      ),

    // Monthly revenue for the last 6 months
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
          gte(invoices.paidAt, sixMonthsAgo),
        ),
      )
      .groupBy(sql`date_trunc('month', ${invoices.paidAt})`)
      .orderBy(sql`date_trunc('month', ${invoices.paidAt}) asc`),

    // Tasks due within the next 7 days or already overdue, joined with project name
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
          isNull(tasks.deletedAt),
          not(inArray(tasks.status, DONE_TASK_STATUSES)),
          lte(tasks.dueDate, sevenDaysFromNow),
        ),
      )
      .orderBy(tasks.dueDate)
      .limit(8),

    // 5 most recently updated active projects with client name
    db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        priority: projects.priority,
        dueDate: projects.dueDate,
        clientName: clients.name,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(
        and(
          eq(projects.organizationId, orgId),
          isNull(projects.deletedAt),
          not(inArray(projects.status, TERMINAL_PROJECT_STATUSES)),
        ),
      )
      .orderBy(desc(projects.updatedAt))
      .limit(5),

    // 8 most recent audit log entries with actor name
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        actorName: user.name,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(user, eq(auditLogs.actorUserId, user.id))
      .where(eq(auditLogs.organizationId, orgId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(8),
  ]);

  // Build a complete 6-month series, filling 0 for months with no data
  // Label format matches PostgreSQL to_char(..., 'Mon YY'): e.g. "Apr 25"
  const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendMap = new Map(
    revenueTrendRows.map((r) => [r.month, Number(r.totalCents ?? 0)]),
  );
  const revenueTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = `${MONTH_ABBR[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    return {
      month: label,
      revenueCents: trendMap.get(label) ?? 0,
    };
  });

  return {
    userName: userRow?.name ?? null,
    kpis: {
      activeClients: activeClientRows[0]?.value ?? 0,
      newClientsThisMonth: newClientRows[0]?.value ?? 0,
      projectsInProgress: activeProjectRows[0]?.value ?? 0,
      projectsDueThisWeek: dueThisWeekRows[0]?.value ?? 0,
      openTasks: openTaskRows[0]?.value ?? 0,
      overdueTasks: overdueTaskRows[0]?.value ?? 0,
      monthlyRevenueCents: Number(revenueRows[0]?.value ?? 0),
    },
    revenueTrend,
    tasksDueSoon: tasksDueSoonRows,
    recentProjects: recentProjectRows,
    recentActivity: recentActivityRows,
  };
}
