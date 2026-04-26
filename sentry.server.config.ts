// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 10% sampling in production to control cost + PII exposure; 100% locally for dev feedback.
  tracesSampleRate: isProduction ? 0.1 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Do NOT auto-attach request headers, cookies, IP, user-agent to events.
  // The structured logger attaches only the context we explicitly pass.
  sendDefaultPii: false,

  // Webhook payloads from Stripe and other providers contain customer emails,
  // charge IDs, and raw event data. Strip request bodies on those routes before
  // the event leaves the process.
  beforeSend(event) {
    const url = event.request?.url ?? "";
    if (/\/api\/(billing\/webhook|webhooks\/)/.test(url)) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
      }
    }
    return event;
  },
});
