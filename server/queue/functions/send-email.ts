import { inngest } from "@/server/queue/inngest-client";
import { sendEmailNow } from "@/server/email/send";

/**
 * Async email worker. Subscribes to `email/send.requested` and calls the
 * existing `sendEmailNow()` pipeline, which handles suppression checks,
 * category opt-outs, the unsubscribe footer, and provider-side retry.
 *
 * Inngest gives us free retries on top of the in-function retry: if this
 * step throws, Inngest re-runs it with exponential backoff (default 4
 * attempts). The combination is intentional - the in-function retry handles
 * the common case of a transient Resend hiccup within seconds, and the
 * Inngest retry covers longer outages where Resend is down for minutes.
 *
 * `concurrency` is conservative (10 concurrent sends per worker instance) so
 * one batch of notifications doesn't burn the Resend rate limit.
 */
export const sendEmailFn = inngest.createFunction(
  {
    id: "send-email",
    name: "Send transactional email",
    concurrency: { limit: 10 },
    retries: 3,
  },
  { event: "email/send.requested" },
  async ({ event, step }) => {
    await step.run("dispatch-to-provider", async () => {
      await sendEmailNow(event.data);
      return { ok: true };
    });
    return { sent: true };
  },
);
