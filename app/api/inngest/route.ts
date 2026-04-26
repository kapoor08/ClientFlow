import { serve } from "inngest/next";
import { inngest } from "@/server/queue/inngest-client";
import { inngestFunctions } from "@/server/queue/functions";

/**
 * Inngest function endpoint. Inngest's hosted runner POSTs here to invoke
 * each function. The `serve` helper handles GET (introspection / health
 * check), PUT (registration), and POST (function execution).
 *
 * Operator setup:
 *   1. Sign up at inngest.com.
 *   2. Create an app, copy `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to
 *      Vercel env vars (production + preview).
 *   3. Set the Inngest "serve URL" to https://client-flow.in/api/inngest.
 *   4. Inngest auto-discovers the registered functions on first deploy.
 *
 * Until step 2 is done, calls to `sendEmail()` fall through to the existing
 * synchronous send path - the Inngest dispatch only kicks in when the env
 * vars are present (see `isInngestConfigured`).
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
