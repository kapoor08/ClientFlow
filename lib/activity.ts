import "server-only";

import { and, desc, eq, gte, ilike, lte, or, count } from "drizzle-orm";
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

export type ActivityEntry = {
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

type ListActivityOptions = {
  query?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export async function listActivityForUser(
  userId: string,
  options: ListActivityOptions = {},
): Promise<{ entries: ActivityEntry[]; pagination: PaginationMeta } | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;

  // Only owner and admin can view activity logs
  if (context.roleKey !== "owner" && context.roleKey !== "admin") return null;

  const {
    query = "",
    entityType,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 10,
  } = options;

  const trimmed = query.trim();

  const conditions = [
    eq(auditLogs.organizationId, context.organizationId),
    trimmed
      ? or(
          ilike(auditLogs.action, `%${trimmed}%`),
          ilike(auditLogs.entityType, `%${trimmed}%`),
          ilike(user.name, `%${trimmed}%`),
          ilike(user.email, `%${trimmed}%`),
        )
      : undefined,
    entityType ? eq(auditLogs.entityType, entityType) : undefined,
    dateFrom ? gte(auditLogs.createdAt, new Date(dateFrom)) : undefined,
    dateTo ? lte(auditLogs.createdAt, new Date(dateTo)) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const whereClause = and(...conditions);

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
    entries: rows.map((r) => ({
      ...r,
      metadata: r.metadata as Record<string, unknown> | null,
    })),
    pagination: buildPaginationMeta(totalResult[0]?.total ?? 0, page, pageSize),
  };
}
