import type { PaginationMeta } from "@/lib/pagination";

export type AuditLogItem = {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditLogsResponse = {
  logs: AuditLogItem[];
  pagination: PaginationMeta;
};
