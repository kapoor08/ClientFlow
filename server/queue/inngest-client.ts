import "server-only";

import { Inngest, EventSchemas } from "inngest";
import type { SendEmailInput } from "@/server/email/types";

/**
 * Inngest client. The event key is read from the env so local dev (where
 * the key is unset) gets a "dev mode" client that's safe to call but won't
 * dispatch anywhere - real production work needs the Inngest signup +
 * INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY in Vercel.
 *
 * Why Inngest over BullMQ + Redis:
 *   - Zero infrastructure to operate (Inngest hosts the queue).
 *   - First-class Vercel + serverless support; no long-lived workers needed.
 *   - Built-in retries, concurrency, and dead-letter handling.
 *   - Free tier covers low-volume SaaS launch traffic.
 *
 * If we outgrow the free tier or need self-hosted, BullMQ + Upstash Redis is
 * the swap target - the function shape (event in, async work out) is the same.
 */

type Events = {
  "email/send.requested": { data: SendEmailInput };
};

export const inngest = new Inngest({
  id: "clientflow",
  name: "ClientFlow",
  schemas: new EventSchemas().fromRecord<Events>(),
});

export const isInngestConfigured = !!process.env.INNGEST_EVENT_KEY;
