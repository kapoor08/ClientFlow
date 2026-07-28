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
 * `concurrency` is conservative (5 concurrent sends) so one batch of
 * notifications doesn't burn the Resend rate limit. Capped at 5 to stay within
 * the Inngest free-plan account concurrency limit - a function requesting more
 * than the plan allows makes Inngest reject the entire app sync, which silently
 * unregisters every function and black-holes all queued events.
 */
export const sendEmailFn = inngest.createFunction(
  {
    id: "send-email",
    name: "Send transactional email",
    concurrency: { limit: 5 },
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
