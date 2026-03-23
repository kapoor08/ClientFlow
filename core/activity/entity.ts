import type { PaginationMeta } from "@/lib/pagination";

export type ActivityEntry = {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type ActivityFilters = {
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
};

export type ActivityResponse = {
  entries: ActivityEntry[];
  pagination: PaginationMeta;
};

export const ENTITY_TYPE_OPTIONS = [
  { value: "all", label: "All activity" },
  { value: "client", label: "Clients" },
  { value: "project", label: "Projects" },
  { value: "file", label: "Files" },
  { value: "invitation", label: "Invitations" },
  { value: "membership", label: "Members" },
] as const;

const ACTION_LABELS: Record<string, string> = {
  "client.created": "created client",
  "client.updated": "updated client",
  "client.deleted": "deleted client",
  "project.created": "created project",
  "project.updated": "updated project",
  "project.deleted": "deleted project",
  "file.uploaded": "uploaded",
  "file.deleted": "deleted file",
  "invitation.sent": "invited",
  "member.role_changed": "changed role for",
  "member.suspended": "suspended",
  "member.reactivated": "reactivated",
  "member.removed": "removed",
};

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function getEntityName(entry: ActivityEntry): string | null {
  const meta = entry.metadata;
  if (!meta) return null;
  if (typeof meta.name === "string" && meta.name) return meta.name;
  if (typeof meta.email === "string" && meta.email) return meta.email;
  return null;
}

const ENTITY_BADGE_STYLES: Record<string, string> = {
  client: "bg-blue-100 text-blue-700",
  project: "bg-violet-100 text-violet-700",
  file: "bg-amber-100 text-amber-700",
  invitation: "bg-emerald-100 text-emerald-700",
  membership: "bg-rose-100 text-rose-700",
};

export function getEntityBadgeStyle(entityType: string): string {
  return ENTITY_BADGE_STYLES[entityType] ?? "bg-secondary text-foreground";
}
