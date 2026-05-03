/**
 * Product timeline.
 *
 * These entries are tied to real milestones from git history rather than
 * invented version numbers. Versions follow the pattern v0.<milestone> until
 * the first tagged release.
 */
export const releases = [
  {
    version: "0.10",
    date: "2026-05-03",
    items: [
      {
        type: "feature",
        text: "Self-hosted public status page with component states, incident history, and email subscribers.",
      },
      {
        type: "feature",
        text: "Production-readiness pass: hardened plan-limit enforcement on the v1 API, idempotent webhook dedup, IP allowlisting on API routes.",
      },
      {
        type: "feature",
        text: "Knowledge base content seeded for the help center.",
      },
    ],
  },
  {
    version: "0.9",
    date: "2026-04-26",
    items: [
      {
        type: "improvement",
        text: "Migrated to external scheduler for cron jobs after Vercel removed the in-config crons surface.",
      },
      {
        type: "improvement",
        text: "Bundle-budget script updated for Next.js 16's removed app-build-manifest.",
      },
      {
        type: "improvement",
        text: "Relaxed react-hooks v6 lint rules and fixed unescaped entities to unblock CI.",
      },
    ],
  },
  {
    version: "0.8",
    date: "2026-04-19",
    items: [
      {
        type: "feature",
        text: "Cron-driven background jobs: dunning reminders, analytics rollups, status probes, and suppression sweeps.",
      },
      { type: "improvement", text: "Code refinements across server modules." },
    ],
  },
  {
    version: "0.7",
    date: "2026-04-14",
    items: [
      {
        type: "feature",
        text: "Admin portal refactor: feature flags, impersonation, platform analytics, and audited admin actions.",
      },
      {
        type: "feature",
        text: "Client portal refactor with project visibility, file sharing, and invoice access.",
      },
    ],
  },
  {
    version: "0.6",
    date: "2026-04-04",
    items: [
      { type: "feature", text: "Platform admin panel scaffolded." },
      { type: "improvement", text: "Application-wide structural improvements." },
    ],
  },
  {
    version: "0.5",
    date: "2026-03-31",
    items: [
      {
        type: "improvement",
        text: "Performance pass: query batching, stricter middleware, and reduced client-side bundles.",
      },
    ],
  },
  {
    version: "0.4",
    date: "2026-03-28",
    items: [
      {
        type: "feature",
        text: "Tasks module: kanban + list views, statuses, assignees, mentions, and due dates.",
      },
    ],
  },
  {
    version: "0.3",
    date: "2026-03-24",
    items: [
      {
        type: "feature",
        text: "Billing module completed with Stripe subscriptions, invoices, and the customer portal.",
      },
    ],
  },
  {
    version: "0.2",
    date: "2026-03-23",
    items: [
      {
        type: "feature",
        text: "Activity logs, notifications, analytics, organization settings, team & roles, audit logs, and security modules shipped.",
      },
      {
        type: "feature",
        text: "Projects, files, and invitations modules shipped.",
      },
    ],
  },
  {
    version: "0.1",
    date: "2026-03-20",
    items: [
      {
        type: "feature",
        text: "Clients and projects modules: the foundation of the work-management surface.",
      },
      {
        type: "feature",
        text: "Initial multi-tenant scaffold with Better Auth and Drizzle.",
      },
    ],
  },
];
