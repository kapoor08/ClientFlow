import "server-only";

import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import { organizations, auditLogs } from "@/db/schema";
import { user } from "@/db/auth-schema";
import {
  buildPaginationMeta,
  paginationOffset,
  type PaginatedResult,
} from "@/utils/pagination";

export type AdminAuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  metadata: unknown;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
  orgName: string | null;
};

type ListAdminAuditLogsOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function listAdminAuditLogs(
  opts: ListAdminAuditLogsOptions = {},
): Promise<PaginatedResult<AdminAuditLogRow>> {
  const { query, page = 1, pageSize = 20, entityType, dateFrom, dateTo } = opts;

  // ── WHERE conditions ────────────────────────────────────────────────────────
  const conditions = [];

  if (query?.trim()) {
    const q = `%${query.trim()}%`;
    conditions.push(
      or(ilike(auditLogs.action, q), ilike(auditLogs.entityType, q))!,
    );
  }
  if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
  if (dateFrom) conditions.push(gte(auditLogs.createdAt, new Date(dateFrom)));
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLogs.createdAt, end));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count(auditLogs.id) })
    .from(auditLogs)
    .where(where);

  const pagination = buildPaginationMeta(total, page, pageSize);

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      ipAddress: auditLogs.ipAddress,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: user.name,
      actorEmail: user.email,
      orgName: organizations.name,
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorUserId, user.id))
    .leftJoin(organizations, eq(auditLogs.organizationId, organizations.id))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pagination.pageSize)
    .offset(paginationOffset(pagination.page, pagination.pageSize));

  return { data: rows, pagination };
}
