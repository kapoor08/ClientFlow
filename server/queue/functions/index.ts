import { sendEmailFn } from "./send-email";

/**
 * Registry of all Inngest functions. Imported by the route handler at
 * `app/api/inngest/route.ts` and exposed as a single `serve()` endpoint.
 *
 * Add new functions here as we move more side-effects off the request path
 * (webhook dispatch is the obvious next candidate).
 */
export const inngestFunctions = [sendEmailFn];
