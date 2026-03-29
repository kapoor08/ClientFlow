export const WEBHOOK_EVENTS = [
  "project.created",
  "project.updated",
  "project.deleted",
  "task.created",
  "task.updated",
  "task.completed",
  "client.created",
  "client.updated",
  "invoice.paid",
  "invoice.overdue",
  "team.member_added",
  "team.member_removed",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
