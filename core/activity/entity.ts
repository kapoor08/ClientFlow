import type { PaginationMeta } from "@/lib/pagination";
import { ENTITY_TYPE_OPTIONS } from "@/helpers/activity";

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
  createdAt: string;
};

export type ActivityFilters = {
  q?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
};

export type ActivityResponse = {
  entries: ActivityEntry[];
  pagination: PaginationMeta;
};

export { ENTITY_TYPE_OPTIONS };

const ACTION_LABELS: Record<string, string> = {
  // Clients
  "client.created": "created client",
  "client.updated": "updated client",
  "client.deleted": "deleted client",
  // Projects
  "project.created": "created project",
  "project.updated": "updated project",
  "project.deleted": "deleted project",
  // Tasks
  "task.created": "created task",
  "task.updated": "updated task",
  "task.deleted": "deleted task",
  "task.completed": "completed task",
  "task.reopened": "reopened task",
  "task.moved": "moved task",
  // Files
  "file.uploaded": "uploaded file",
  "file.deleted": "deleted file",
  // Invoices
  "invoice.created": "created invoice",
  "invoice.updated": "updated invoice",
  "invoice.sent": "sent invoice",
  "invoice.paid": "marked invoice as paid",
  "invoice.deleted": "deleted invoice",
  // Time entries
  "time_entry.created": "logged time",
  "time_entry.deleted": "deleted time entry",
  // Invitations
  "invitation.sent": "sent invitation to",
  "invitation.resent": "resent invitation to",
  "invitation.revoked": "revoked invitation for",
  "invitation.accepted": "accepted invitation to",
  // Members
  "member.role_changed": "changed role for",
  "member.suspended": "suspended",
  "member.reactivated": "reactivated",
  "member.removed": "removed",
  "member.permissions_updated": "updated permissions for",
  // Organization
  "organization.updated": "updated organization settings",
  "organization.branding_updated": "updated organization branding",
  "organization.sso_updated": "updated SSO configuration",
  "organization.security_updated": "updated security policies",
  // Role permissions
  "role_permissions.updated": "updated role permissions",
};

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getActionLabel(action: string): string {
  const raw = ACTION_LABELS[action] ?? (() => {
    const parts = action.split(".");
    if (parts.length >= 2) return parts.slice(1).join(" ").replace(/_/g, " ");
    return action.replace(/[._]/g, " ");
  })();
  return toTitleCase(raw);
}

export function getEntityName(entry: ActivityEntry): string | null {
  const meta = entry.metadata;
  if (!meta) return null;
  if (typeof meta.name === "string" && meta.name) return meta.name;
  // Invoices: show "INV-0001 - Title"
  if (typeof meta.number === "string" && meta.number) {
    const title = typeof meta.title === "string" ? meta.title : null;
    return title ? `${meta.number} - ${title}` : meta.number;
  }
  if (typeof meta.email === "string" && meta.email) return meta.email;
  return null;
}

const ENTITY_BADGE_STYLES: Record<string, string> = {
  client: "bg-blue-100 text-blue-700",
  project: "bg-violet-100 text-violet-700",
  task: "bg-indigo-100 text-indigo-700",
  file: "bg-amber-100 text-amber-700",
  invoice: "bg-orange-100 text-orange-700",
  time_entry: "bg-cyan-100 text-cyan-700",
  invitation: "bg-emerald-100 text-emerald-700",
  membership: "bg-rose-100 text-rose-700",
  organization: "bg-slate-100 text-slate-700",
};

export function getEntityBadgeStyle(entityType: string): string {
  return ENTITY_BADGE_STYLES[entityType] ?? "bg-secondary text-foreground";
}
