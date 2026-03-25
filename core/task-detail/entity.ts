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
  reporterUserId: string | null;
  reporterName: string | null;
  dueDate: string | null;
  estimateMinutes: number | null;
  createdAt: string;
  updatedAt: string;
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
};

export type TaskAttachment = {
  id: string;
  storageKey: string;
  storageUrl: string | null;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
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

    default:
      return formatActivityLabel(action);
  }
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
