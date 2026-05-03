import "server-only";

/**
 * Shared type contract for the task-activity broadcaster fan-out. Each
 * provider (Slack, Teams) consumes the same event shape so call sites in
 * `server/tasks.ts` and `server/task-comments.ts` only ever need to fire
 * one event payload regardless of how many channels the org has wired.
 */

export type TaskBroadcastBase = {
  organizationId: string;
  actorUserId: string;
  taskTitle: string;
  taskRef?: string | null;
  projectId?: string | null;
  assigneeUserId?: string | null;
  /** Lower-cased priority key (urgent/high/medium/low/none). */
  priority?: string | null;
  /** Lower-cased status key (todo/in_progress/review/blocked/done). */
  status?: string | null;
  /** Date or ISO string. */
  dueDate?: Date | string | null;
};

export type TaskBroadcastEvent =
  | ({ kind: "created" } & TaskBroadcastBase)
  | ({ kind: "updated"; changes: string[] } & TaskBroadcastBase)
  | ({ kind: "deleted" } & TaskBroadcastBase)
  | ({ kind: "moved"; fromColumn: string | null; toColumn: string | null } & TaskBroadcastBase)
  | ({ kind: "commented"; commentSnippet: string } & TaskBroadcastBase);
