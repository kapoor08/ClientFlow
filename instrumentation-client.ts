// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // 10% sampling in production to control cost + PII exposure.
  tracesSampleRate: isProduction ? 0.1 : 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Session replay sample rates - 10% of normal sessions, 100% when an error occurs.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Do NOT auto-attach IP, user-agent, or other PII to events. With replay enabled,
  // the replay integration already masks text and inputs by default.
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
