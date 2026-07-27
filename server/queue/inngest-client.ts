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

/**
 * Whether outbound work should be dispatched through Inngest.
 *
 * Requires BOTH:
 *   - `INNGEST_EVENT_KEY` present, and
 *   - a production runtime (`NODE_ENV === "production"`).
 *
 * The `NODE_ENV` guard matters: with only the key check, setting
 * `INNGEST_EVENT_KEY` in a local `.env` routed every email into Inngest, but
 * `next dev` puts the SDK in inferred *dev* mode where `send()` targets the
 * local Inngest Dev Server (localhost:8288). With no dev server running, the
 * send throws and the email is never delivered - and the documented
 * synchronous fallback never kicks in. Gating on `NODE_ENV` aligns our routing
 * with the SDK's own dev/cloud inference: dev + non-prod -> synchronous send
 * (works with no extra infra); prod -> async queue (Inngest can reach the
 * public /api/inngest serve URL). Production behavior is unchanged.
 */
export const isInngestConfigured =
  process.env.NODE_ENV === "production" && !!process.env.INNGEST_EVENT_KEY;
