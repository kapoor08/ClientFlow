import "server-only";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user } from "@/db/auth-schema";
import { projects } from "@/db/schema";
import { sendTeamsMessage } from "./send";
import {
  buildTaskCard,
  priorityEmoji,
  statusEmoji,
  styleForPriority,
  type TaskCardField,
  type TaskCardInput,
} from "./payloads";
import type { TaskBroadcastBase, TaskBroadcastEvent } from "../broadcasts-types";

/**
 * Microsoft Teams half of the unified task-activity broadcaster. Same input
 * shape as the Slack broadcaster - both run in parallel from the umbrella
 * `broadcastTaskActivity()` so call sites don't care which channels are
 * wired up.
 */

// ─── Display helpers (mirror Slack ones) ──────────────────────────────────────

function formatPriority(p: string | null | undefined): string {
  if (!p) return "None";
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

function formatStatus(s: string | null | undefined): string {
  if (!s) return "—";
  const map: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    review: "Review",
    blocked: "Blocked",
    done: "Done",
  };
  return map[s] ?? s;
}

function formatDueDate(due: Date | string | null | undefined): string {
  if (!due) return "No due date";
  const d = due instanceof Date ? due : new Date(due);
  if (isNaN(d.getTime())) return "No due date";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function appBase(): string | undefined {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
}

function buildTaskUrl(taskRef: string | null | undefined): string | undefined {
  if (!taskRef) return undefined;
  const base = appBase();
  if (!base) return undefined;
  return `${base}/tasks?task=${encodeURIComponent(taskRef)}`;
}

function buildProjectUrl(projectId: string | null | undefined): string | undefined {
  if (!projectId) return undefined;
  const base = appBase();
  if (!base) return undefined;
  return `${base}/projects/${encodeURIComponent(projectId)}`;
}

/**
 * Adaptive Cards uses Markdown for inline links: `[label](url)`. Different
 * syntax from Slack's mrkdwn `<url|label>`, so we keep a Teams-specific
 * subtitle builder.
 */
function buildSubtitle(projectName: string | null, projectId: string | null | undefined): string {
  if (!projectName) return "Task";
  const url = buildProjectUrl(projectId);
  return url ? `Task in [${projectName}](${url})` : `Task in **${projectName}**`;
}

// ─── Enrichment ────────────────────────────────────────────────────────────────

type Enriched = {
  actorName: string;
  projectName: string | null;
  assigneeName: string | null;
};

async function enrich(event: TaskBroadcastBase): Promise<Enriched> {
  const userIds = [event.actorUserId];
  if (event.assigneeUserId && event.assigneeUserId !== event.actorUserId) {
    userIds.push(event.assigneeUserId);
  }

  const [userRows, projectRows] = await Promise.all([
    db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, userIds)),
    event.projectId
      ? db
          .select({ name: projects.name })
          .from(projects)
          .where(eq(projects.id, event.projectId))
          .limit(1)
      : Promise.resolve([] as { name: string | null }[]),
  ]);

  const userMap = new Map(userRows.map((u) => [u.id, u.name]));
  return {
    actorName: userMap.get(event.actorUserId)?.trim() || "A teammate",
    projectName: projectRows[0]?.name ?? null,
    assigneeName: event.assigneeUserId ? userMap.get(event.assigneeUserId)?.trim() || null : null,
  };
}

function commonFields(event: TaskBroadcastBase, enriched: Enriched): TaskCardField[] {
  return [
    {
      label: "Priority",
      value: `${priorityEmoji(event.priority)} ${formatPriority(event.priority)}`,
    },
    { label: "Status", value: `${statusEmoji(event.status)} ${formatStatus(event.status)}` },
    { label: "Assignee", value: enriched.assigneeName ?? "Unassigned" },
    { label: "Due", value: formatDueDate(event.dueDate) },
  ];
}

// ─── Card per event kind ───────────────────────────────────────────────────────

function buildCardForEvent(event: TaskBroadcastEvent, enriched: Enriched) {
  const taskLabel = event.taskRef ? `${event.taskRef} — ${event.taskTitle}` : event.taskTitle;
  const subtitle = buildSubtitle(enriched.projectName, event.projectId);
  const actionUrl = buildTaskUrl(event.taskRef);

  switch (event.kind) {
    case "created":
      return buildTaskCard({
        contextLine: `${enriched.actorName} created a task`,
        title: taskLabel,
        subtitle,
        fields: commonFields(event, enriched),
        style: styleForPriority(event.priority),
        actionUrl,
      });

    case "updated": {
      const style: TaskCardInput["style"] = event.status === "done" ? "good" : "warning";
      return buildTaskCard({
        contextLine: `${enriched.actorName} updated a task`,
        title: taskLabel,
        subtitle,
        metaLine: event.changes.length ? `Changed: ${event.changes.join(" · ")}` : undefined,
        fields: commonFields(event, enriched),
        style,
        actionUrl,
      });
    }

    case "deleted":
      return buildTaskCard({
        contextLine: `${enriched.actorName} deleted a task`,
        title: taskLabel,
        subtitle,
        style: "attention",
      });

    case "moved":
      return buildTaskCard({
        contextLine: `${enriched.actorName} moved a task`,
        title: taskLabel,
        subtitle,
        metaLine: `${event.fromColumn ?? "Backlog"} → ${event.toColumn ?? "Backlog"}`,
        fields: commonFields(event, enriched),
        style: "accent",
        actionUrl,
      });

    case "commented":
      return buildTaskCard({
        contextLine: `${enriched.actorName} commented on a task`,
        title: taskLabel,
        subtitle,
        body: `> ${event.commentSnippet}`,
        fields: commonFields(event, enriched),
        style: "default",
        actionUrl,
      });
  }
}

export async function broadcastTaskActivityToTeams(event: TaskBroadcastEvent): Promise<void> {
  const enriched = await enrich(event);
  const payload = buildCardForEvent(event, enriched);
  await sendTeamsMessage(event.organizationId, payload);
}
