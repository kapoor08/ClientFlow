/**
 * Shared types for the email send pipeline. Lives in its own file so the
 * Inngest client (server/queue/inngest-client.ts) can import them without
 * pulling in node:fs / template loading code from server/email/send.ts.
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: Array<{ name: string; value: string }>;
  idempotencyKey?: string;
};
