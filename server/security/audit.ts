import "server-only";

import { db } from "@/server/db/client";
import { auditLogs } from "@/db/schema";

export type WriteAuditLogOptions = {
  organizationId: string;
  /**
   * The user who performed the action. Use `null` for system-initiated work
   * (cron jobs, API-key calls without an associated session, anonymisation
   * jobs).
   */
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
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
