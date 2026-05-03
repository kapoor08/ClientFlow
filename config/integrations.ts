/**
 * "Built on" content for /integrations.
 *
 * ClientFlow does not yet expose first-party app integrations (Slack, Teams,
 * GitHub, Zapier are on the roadmap). This page instead lists the production
 * services the platform runs on so prospective customers know what powers
 * billing, email, file storage, observability, etc.
 */
export const categories = [
  {
    name: "Infrastructure",
    integrations: [
      {
        name: "Neon Postgres",
        desc: "Primary database. Serverless Postgres with branching, point-in-time recovery, and strict tenant isolation.",
      },
      {
        name: "Vercel",
        desc: "Next.js App Router hosting with edge middleware, ISR, and zero-config preview deployments.",
      },
      {
        name: "Cloudflare",
        desc: "DNS, Turnstile bot protection on public forms, and edge-level abuse controls.",
      },
    ],
  },
  {
    name: "Billing & Payments",
    integrations: [
      {
        name: "Stripe",
        desc: "Subscriptions, invoices, customer portal, dunning, refunds, and webhook-driven plan updates.",
      },
    ],
  },
  {
    name: "Communication",
    integrations: [
      {
        name: "Resend",
        desc: "Transactional email delivery with bounce, complaint, and unsubscribe webhook handling.",
      },
      {
        name: "Web Push",
        desc: "Native browser push notifications via the standards-based Web Push protocol.",
      },
    ],
  },
  {
    name: "Files & Media",
    integrations: [
      {
        name: "Cloudinary",
        desc: "Signed uploads, CDN delivery, and on-the-fly image transforms for project files and avatars.",
      },
    ],
  },
  {
    name: "Reliability & Observability",
    integrations: [
      {
        name: "Sentry",
        desc: "Error monitoring, performance tracing, and release tracking across the full stack.",
      },
      {
        name: "Upstash Redis",
        desc: "Sliding-window rate limiting, ephemeral caches, and idempotency keys.",
      },
      {
        name: "Inngest",
        desc: "Durable background jobs for billing reconciliation, dunning reminders, and analytics rollups.",
      },
      {
        name: "PostHog",
        desc: "Product analytics and feature-flag instrumentation.",
      },
    ],
  },
  {
    name: "Authentication",
    integrations: [
      {
        name: "Better Auth",
        desc: "Session-based auth with TOTP two-factor, Google OAuth, and email verification flows.",
      },
    ],
  },
];
