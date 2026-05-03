import "server-only";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user } from "@/db/auth-schema";
import { projects } from "@/db/schema";
import { sendSlackMessage } from "./send";
import {
  buildTaskCard,
  colorForPriority,
  priorityEmoji,
  SLACK_COLORS,
  statusEmoji,
  type TaskCardField,
} from "./payloads";
import type { TaskBroadcastBase, TaskBroadcastEvent } from "../broadcasts-types";

export type { TaskBroadcastBase, TaskBroadcastEvent } from "../broadcasts-types";

/**
 * "Team activity feed" broadcasts to a connected org's Slack channel.
 *
 * Runs alongside `dispatchNotification()` - the dispatcher decides who needs
 * a personal in-app/email notification, while these broadcasts unconditionally
 * announce every task action in Slack. Two paths intentionally do not share
 * state.
 *
 * Callers pass the IDs they already have in scope (project, assignee). The
 * broadcaster does its own name resolution in a single `IN (...)` query so
 * call sites stay tidy.
 */

// ─── Display helpers ───────────────────────────────────────────────────────────

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

function escapeMrkdwn(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Build the "Task in <project>" subtitle. When we have a project ID we link
 * the project name back to its page in ClientFlow, mirroring the Slack
 * Lists "Item in <list-link>" pattern from the screenshot.
 */
function buildSubtitle(projectName: string | null, projectId: string | null | undefined): string {
  if (!projectName) return "Task";
  const url = buildProjectUrl(projectId);
  const safeName = escapeMrkdwn(projectName);
  return url ? `Task in <${url}|${safeName}>` : `Task in *${safeName}*`;
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

// ─── Card builders per event kind ──────────────────────────────────────────────

function commonFields(event: TaskBroadcastBase, enriched: Enriched): TaskCardField[] {
  // Priority/status get emoji prefixes for at-a-glance color cues. Slack
  // mrkdwn doesn't support colored pill backgrounds in regular messages
  // (those exist only in Slack Lists), so this is the closest visual.
  return [
    {
      label: "Priority",
      value: `${priorityEmoji(event.priority)} ${formatPriority(event.priority)}`,
    },
    { label: "Status", value: `${statusEmoji(event.status)} ${formatStatus(event.status)}` },
    { label: "Assignee", value: escapeMrkdwn(enriched.assigneeName ?? "Unassigned") },
    { label: "Due", value: formatDueDate(event.dueDate) },
  ];
}

function buildCardForEvent(event: TaskBroadcastEvent, enriched: Enriched) {
  const taskLabel = event.taskRef ? `${event.taskRef} — ${event.taskTitle}` : event.taskTitle;
  const safeActor = escapeMrkdwn(enriched.actorName);
  const subtitle = buildSubtitle(enriched.projectName, event.projectId);
  const actionUrl = buildTaskUrl(event.taskRef);

  switch (event.kind) {
    case "created":
      return buildTaskCard({
        contextLine: `*${safeActor}* created a task`,
        title: taskLabel,
        subtitle,
        fields: commonFields(event, enriched),
        color: colorForPriority(event.priority),
        actionUrl,
      });

    case "updated":
      return buildTaskCard({
        contextLine: `*${safeActor}* updated a task`,
        title: taskLabel,
        subtitle,
        metaLine: event.changes.length
          ? `Changed: ${event.changes.map(escapeMrkdwn).join(" · ")}`
          : undefined,
        fields: commonFields(event, enriched),
        color: event.status === "done" ? SLACK_COLORS.green : SLACK_COLORS.amber,
        actionUrl,
      });

    case "deleted":
      return buildTaskCard({
        contextLine: `*${safeActor}* deleted a task`,
        title: taskLabel,
        subtitle,
        color: SLACK_COLORS.red,
        // Intentionally no fields/button - the task no longer exists.
      });

    case "moved":
      return buildTaskCard({
        contextLine: `*${safeActor}* moved a task`,
        title: taskLabel,
        subtitle,
        metaLine: `${escapeMrkdwn(event.fromColumn ?? "Backlog")} → ${escapeMrkdwn(event.toColumn ?? "Backlog")}`,
        fields: commonFields(event, enriched),
        color: SLACK_COLORS.blue,
        actionUrl,
      });

    case "commented":
      return buildTaskCard({
        contextLine: `*${safeActor}* commented on a task`,
        title: taskLabel,
        subtitle,
        body: `> ${escapeMrkdwn(event.commentSnippet)}`,
        fields: commonFields(event, enriched),
        color: SLACK_COLORS.slate,
        actionUrl,
      });
  }
}

// ─── Public entry point ────────────────────────────────────────────────────────

export async function broadcastTaskActivityToSlack(event: TaskBroadcastEvent): Promise<void> {
  const enriched = await enrich(event);
  const payload = buildCardForEvent(event, enriched);
  await sendSlackMessage(event.organizationId, payload);
}
