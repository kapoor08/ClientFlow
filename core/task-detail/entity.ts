export type TaskDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  projectId: string;
  projectName: string | null;
  columnId: string | null;
  columnName: string | null;
  columnColor: string | null;
  assigneeUserId: string | null;
  assigneeName: string | null;
  assignees: { userId: string; name: string | null }[];
  reporterUserId: string | null;
  reporterName: string | null;
  dueDate: string | null;
  estimateMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  refNumber: string | null;
  tags: string[];
};

export type TaskComment = {
  id: string;
  body: string;
  authorUserId: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskActivity = {
  id: string;
  action: string;
  actorUserId: string | null;
  actorName: string | null;
  newValues: Record<string, unknown> | null;
  oldValues: Record<string, unknown> | null;
  createdAt: string;
};

export type SubtaskItem = {
  id: string;
  title: string;
  status: string;
  assigneeUserId: string | null;
  assigneeName: string | null;
  createdAt: string;
  tags: string[];
};

export type TaskAttachment = {
  id: string;
  storageKey: string;
  storageUrl: string | null;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploaderName: string | null;
  createdAt: string;
};

export type SignedUploadParams = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
};

export function formatActivityLabel(action: string): string {
  const labels: Record<string, string> = {
    "comment.added": "left a comment",
    "task.created": "created this task",
    "task.updated": "updated this task",
    "task.deleted": "deleted this task",
    "column.moved": "moved this task",
    "title.changed": "renamed this task",
    "priority.changed": "changed priority",
    "status.changed": "changed status",
    "assignee.changed": "changed assignee",
    "dueDate.changed": "changed due date",
  };
  return labels[action] ?? action;
}

/**
 * Returns a rich, human-readable description of a single activity entry,
 * e.g. "changed priority from Medium to High" or "assigned this to Jane Smith".
 */
export function formatActivityMessage(
  action: string,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
): string {
  const nv = newValues ?? {};
  const ov = oldValues ?? {};

  switch (action) {
    case "task.created":
      return "created this task";

    case "title.changed":
      return `renamed to "${nv.label}"`;

    case "priority.changed": {
      const from = (ov.label as string) ?? "None";
      const to = (nv.label as string) ?? "None";
      return `changed priority from ${capitalize(from)} to ${capitalize(to)}`;
    }

    case "status.changed": {
      const from = (ov.label as string) ?? "—";
      const to = (nv.label as string) ?? "—";
      return `changed status from ${from} to ${to}`;
    }

    case "assignee.changed": {
      const toName = nv.name as string | null;
      const fromName = ov.name as string | null;
      if (!toName) return "unassigned this task";
      if (!fromName) return `assigned this to ${toName}`;
      return `reassigned from ${fromName} to ${toName}`;
    }

    case "column.moved": {
      const toName = nv.name as string | null;
      if (toName) return `moved to ${toName}`;
      return "moved to a new column";
    }

    case "dueDate.changed": {
      const to = nv.label as string | null;
      if (!to || to === "None") return "removed the due date";
      return `set due date to ${to}`;
    }

    case "estimate.changed": {
      const mins = nv.minutes as number | null;
      if (!mins) return "removed the estimate";
      return `set estimate to ${formatEstimateMinutes(mins)}`;
    }

    case "description.changed": {
      const hadBefore = ov.hadContent as boolean;
      const hasNow = nv.hadContent as boolean;
      if (!hadBefore && hasNow) return "added a description";
      if (hadBefore && !hasNow) return "removed the description";
      return "updated the description";
    }

    case "tags.changed": {
      const added = (nv.added as string[]) ?? [];
      const removed = (ov.removed as string[]) ?? [];
      const parts: string[] = [];
      if (added.length) parts.push(`added ${added.map((t) => `#${t}`).join(", ")}`);
      if (removed.length) parts.push(`removed ${removed.map((t) => `#${t}`).join(", ")}`);
      return parts.join(" and ") || "updated tags";
    }

    case "comment.added":
      return "added a comment";

    case "comment.updated":
      return "edited a comment";

    case "comment.deleted":
      return "deleted a comment";

    case "attachment.added": {
      const name = nv.fileName as string | null;
      return name ? `added file "${name}"` : "added a file";
    }

    case "attachment.deleted": {
      const name = ov.fileName as string | null;
      return name ? `removed file "${name}"` : "removed a file";
    }

    case "assignees.changed": {
      const newNames = (nv.names as string[]) ?? [];
      const oldNames = (ov.names as string[]) ?? [];
      if (newNames.length === 0) return "removed all assignees";
      if (oldNames.length === 0) return `assigned ${newNames.join(", ")}`;
      return `updated assignees to ${newNames.join(", ")}`;
    }

    case "subtask.added": {
      const title = nv.title as string | null;
      return title ? `added subtask "${title}"` : "added a subtask";
    }

    case "subtask.completed": {
      const title = nv.title as string | null;
      return title ? `completed subtask "${title}"` : "completed a subtask";
    }

    case "subtask.reopened": {
      const title = nv.title as string | null;
      return title ? `reopened subtask "${title}"` : "reopened a subtask";
    }

    case "subtask.deleted": {
      const title = ov.title as string | null;
      return title ? `deleted subtask "${title}"` : "deleted a subtask";
    }

    case "time.logged": {
      const mins = nv.minutes as number | null;
      const desc = nv.description as string | null;
      const formatted = mins ? formatEstimateMinutes(mins) : "time";
      return desc ? `logged ${formatted} — ${desc}` : `logged ${formatted}`;
    }

    default:
      return formatActivityLabel(action);
  }
}

/** Format total minutes as a compact string (mirrors lib/tasks-shared) */
function formatEstimateMinutes(mins: number): string {
  let rem = mins;
  const W = 5 * 8 * 60, D = 8 * 60, H = 60;
  const w = Math.floor(rem / W); rem %= W;
  const d = Math.floor(rem / D); rem %= D;
  const h = Math.floor(rem / H); rem %= H;
  const m = rem;
  return [w && `${w}w`, d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ");
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
