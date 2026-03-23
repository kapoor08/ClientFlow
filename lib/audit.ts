import "server-only";

import { and, desc, eq, ilike, or, count } from "drizzle-orm";
import { auditLogs } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import {
  DEFAULT_PAGE_SIZE,
  buildPaginationMeta,
  paginationOffset,
  type PaginationMeta,
} from "@/lib/pagination";

export type AuditLogEntry = {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type WriteAuditLogOptions = {
  organizationId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(opts: WriteAuditLogOptions): Promise<void> {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    organizationId: opts.organizationId,
    actorUserId: opts.actorUserId,
    action: opts.action,
    entityType: opts.entityType,
    entityId: opts.entityId ?? null,
    ipAddress: opts.ipAddress ?? null,
    userAgent: opts.userAgent ?? null,
    metadata: opts.metadata ?? null,
  });
}

type ListAuditLogsOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
};

export async function listAuditLogsForUser(
  userId: string,
  options: ListAuditLogsOptions = {},
): Promise<{
  logs: AuditLogEntry[];
  pagination: PaginationMeta;
} | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  // Only owner and admin can view audit logs
  if (context.roleKey !== "owner" && context.roleKey !== "admin") return null;

  const { query = "", page = 1, pageSize = DEFAULT_PAGE_SIZE } = options;
  const trimmed = query.trim();

  const whereClause = and(
    eq(auditLogs.organizationId, context.organizationId),
    trimmed
      ? or(
          ilike(auditLogs.action, `%${trimmed}%`),
          ilike(auditLogs.entityType, `%${trimmed}%`),
          ilike(user.name, `%${trimmed}%`),
          ilike(user.email, `%${trimmed}%`),
        )
      : undefined,
  );

  const [totalResult, rows] = await Promise.all([
    db
      .select({ total: count(auditLogs.id) })
      .from(auditLogs)
      .leftJoin(user, eq(auditLogs.actorUserId, user.id))
      .where(whereClause),

    db
      .select({
        id: auditLogs.id,
        actorName: user.name,
        actorEmail: user.email,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(user, eq(auditLogs.actorUserId, user.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset(paginationOffset(page, pageSize)),
  ]);

  return {
    logs: rows.map((r) => ({
      ...r,
      metadata: r.metadata as Record<string, unknown> | null,
    })),
    pagination: buildPaginationMeta(totalResult[0]?.total ?? 0, page, pageSize),
  };
}
