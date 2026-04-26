# ClientFlow

### Production-Grade Multi-Tenant SaaS Platform for Agencies & Service-Based Businesses

---

## Overview

ClientFlow is a fully-featured, multi-tenant SaaS platform built for agencies, consultants, and service teams to manage clients, projects, tasks, billing, files, and collaboration from a single system.

The platform is built to production standards - not as a demo. It demonstrates real-world SaaS engineering: strict tenant isolation, subscription monetization, event-driven processing, multi-channel notifications, external integrations, and a white-label client portal.

**Live:** [client-flow.in](https://client-flow.in)

**Production readiness:** **~95 % aggregate** across 32 audit categories (post the v3 audit + roadmap stretch). The full scorecard lives at [`docs/production-readiness-report-v3.md`](./docs/production-readiness-report-v3.md), and the path beyond is in [`docs/production-readiness-roadmap-to-100.md`](./docs/production-readiness-roadmap-to-100.md). The remaining gap is mostly vendor / operator decisions (live-chat vendor, branch protection, Inngest signup) and content (knowledge-base growth) - not code.

---

## Tech Stack

### Frontend

| Layer       | Technology                        |
| ----------- | --------------------------------- |
| Framework   | Next.js 16 (App Router)           |
| Language    | TypeScript 5                      |
| Styling     | Tailwind CSS v4 + shadcn/ui       |
| State       | TanStack Query v5                 |
| URL State   | nuqs v2                           |
| Forms       | React Hook Form + Zod v4          |
| Rich Text   | Tiptap v3 (mentions, attachments) |
| Drag & Drop | dnd-kit                           |
| Charts      | Recharts                          |
| Animations  | Framer Motion                     |
| Markdown    | react-markdown + remark-gfm       |
| Analytics   | PostHog (consent-gated)           |

### Backend

| Layer              | Technology                          |
| ------------------ | ----------------------------------- |
| API                | Next.js Route Handlers              |
| Auth               | BetterAuth v1.5 (+ emailOTP plugin) |
| Database           | PostgreSQL (Neon serverless)        |
| ORM                | Drizzle ORM                         |
| Cache / Pub-Sub    | Upstash Redis (REST + ioredis TCP)  |
| Rate Limiting      | @upstash/ratelimit (sliding window) |
| Async jobs         | Inngest (optional, soft-skip)       |
| Payments           | Stripe v20 (with circuit breaker)   |
| Email              | Resend / EmailJS (dual-provider)    |
| File Storage       | Cloudinary                          |
| Push Notifications | Web Push (VAPID)                    |
| Real-Time          | Server-Sent Events (SSE)            |
| Bot Protection     | Cloudflare Turnstile (soft-skip)    |
| Error Tracking     | Sentry (PII-scrubbed, 10 % traces)  |

---

## Architecture

ClientFlow uses a **modular monolith** with a shared-database, tenant-scoped multi-tenancy model. Every primary table carries an `organization_id`. All queries are tenant-scoped at the service layer; high-traffic detail fetchers add a defence-in-depth `assertSameTenant` post-fetch check via `server/auth/tenant-guard.ts`. A staged Postgres RLS rollout (`scripts/rls/`) is documented and ships disabled-by-default for opt-in DB-layer enforcement.

```
app/
├── (public)/          # Marketing, pricing, legal, /help (KB), /status
├── (protected)/       # Authenticated workspace + client portal
├── (onboarding)/      # New-user onboarding flow
├── auth/              # Auth pages (sign-in, sign-up, email-OTP, MFA, SSO)
├── admin/             # Platform admin (users, orgs, plans, flags, both webhook DLQs)
├── api/
│   ├── v1/            # Public REST API (X-API-Key, GET + POST + Idempotency-Key)
│   ├── cron/          # Vercel Cron handlers (7 jobs, runCron-wrapped)
│   ├── webhooks/      # Inbound (Stripe, Resend bounce/complaint)
│   ├── inngest/       # Inngest function dispatch endpoint
│   ├── openapi.json/  # Hand-written OpenAPI 3.1 spec for /api/v1
│   └── ...            # Internal session-authed endpoints
│
core/                  # Use-cases per domain (framework-agnostic)
lib/                   # Shared utilities, service functions
│   ├── analytics/     # PostHog client + server event capture
│   ├── billing/       # India GST module (HSN/SAC, GSTIN, CGST/SGST/IGST snapshot)
│   └── feature-flags.ts  # In-house DB-backed flag evaluation (per-org overrides)
server/
│   ├── api/           # ApiError + helpers, v1 mutations, idempotency
│   ├── auth/          # BetterAuth + permissions + tenant guard
│   ├── billing/       # Stripe event handlers, dunning, GST snapshot
│   ├── cron/          # runCron wrapper (Sentry capture + duration)
│   ├── db/            # Drizzle client + setTenantContext (RLS-ready)
│   ├── email/         # Send pipeline (suppression + category opt-out + queue)
│   ├── observability/ # Structured logger
│   ├── queue/         # Inngest client + functions
│   ├── security/      # Audit log, IP allowlist, Turnstile
│   └── third-party/   # Stripe (with circuit breaker), Resend, Cloudinary
db/
├── schemas/           # Drizzle schema files per domain
│   ├── access.ts      # Orgs, roles, memberships, API keys, outbound webhooks + DLQ
│   ├── work.ts        # Clients, projects, tasks, time entries
│   ├── billing.ts     # Plans, subscriptions, invoices (incl. GST snapshot fields)
│   ├── platform.ts    # Notifications, prefs (per-event + per-category), feature flags
│   └── support.ts     # Support tickets
emails/templates/      # 46 HTML email templates
config/
│   ├── kb-articles.ts # Knowledge-base article content (markdown)
│   ├── navigation.ts  # User sidebar nav
│   └── ...
scripts/
│   ├── bundle-budget.mjs  # Per-route JS-size gate (CI step)
│   └── rls/           # Postgres row-level security rollout (disabled-by-default)
docs/                  # Production-readiness audits (v1, v2, v3), roadmap, runbooks
drizzle/               # Migration files (0000-0024+)
```

---

## Features

### Authentication & Security

- **Email / Password** authentication via BetterAuth
- **Google OAuth** (configurable)
- **Two-Factor Authentication (TOTP)** with backup code regeneration
- **Email-OTP fallback sign-in** - 6-digit code emailed for users without password access (`/auth/sign-in-otp`)
- **Single Sign-On (SSO)** - OIDC/SAML, Google Workspace, Azure AD, Okta
- **SSO enforcement** per organization (blocks non-SSO logins when enabled)
- **Password complexity policy** enforced server-side via BetterAuth `hooks.before` (8 chars + upper + lower + digit + symbol)
- **Per-account sign-in lockout** - 5 failed attempts / 15-minute window, Upstash-backed, IP-independent
- **Cloudflare Turnstile** on sign-up, contact, and forgot-password forms (soft-skipped when keys absent)
- **Session management** - configurable timeout per org, per-session revocation, "Sign Out All Other Devices" button
- **IP allowlist** enforcement at protected layout (CIDR + IPv6-mapped IPv4 normalisation)
- **Risky sign-in detection** with email alerts
- **Rate limiting** - 10 req/10s on auth endpoints, 120 req/60s on all API routes (per-IP, Upstash sliding window); 1,000 req/min per API key for `/api/v1` traffic; monthly per-key usage counter visible in the API key UI

---

### Security Hardening

- **Content-Security-Policy** in _enforcing_ mode in production. `CSP_REPORT_ONLY=1` env flag flips to Report-Only as an emergency rollback path without a code change.
- **Strict-Transport-Security** (`max-age=63072000; includeSubDomains; preload`) - production only
- **X-Frame-Options: DENY**, **X-Content-Type-Options: nosniff**, **Referrer-Policy: strict-origin-when-cross-origin**
- **Permissions-Policy** locking down camera / mic / geolocation / payment except for Stripe
- **Cookie hardening** - `Secure`, `HttpOnly`, `SameSite=Lax` (production)
- **Sentry hardening** - `sendDefaultPii: false`, `tracesSampleRate: 0.1` in prod, request-body scrubbing for `/api/billing/webhook` and `/api/webhooks/*`
- **`npm audit` step** in CI (non-blocking, weekly review)
- **Postgres Row-Level Security** policies for every tenant-scoped table, ready to enable via the staged plan in `scripts/rls/README.md`

---

### Privacy & GDPR Compliance

- **Self-service data export (Article 20)** - `/api/settings/my-data-export` returns a JSON attachment of the user's account, preferences, activity, and work; redacts session tokens, OAuth secrets, password hashes, 2FA secrets, API key hashes; audit-logged
- **Self-service account deletion (Article 17)** - 30-day grace period with cancel-anytime banner; sole-owner-with-members blocker; nightly anonymisation transaction NULLs FKs and hard-deletes session/account/notifications/push
- **Cookie consent banner** - essential / analytics / marketing tiers, `cf_consent` cookie, server-side honored
- **Signed unsubscribe footer** on every outbound email (HMAC-SHA256, timing-safe verify)
- **Email suppression list** with critical-module bypass (auth / billing / security always send)
- **Per-category email preferences** - product / billing / marketing opt-in toggles surfaced at `/notifications/preferences`; mutations audit-logged

---

### Multi-Tenant Organization System

- Users can belong to multiple organizations with independent roles
- **Organization switcher** in the app header
- Per-organization **settings**: logo, brand color, timezone, currency, session timeout, SSO config, IP allowlist, GSTIN
- **White-label branding** - brand color propagates across the full UI (buttons, badges, sidebar, backgrounds, gradients) via server-injected CSS variable overrides
- **Custom role permissions** - per-role feature access configurable by org admins
- **Member permission overrides** - individual permission exceptions per member
- **Defence-in-depth tenant isolation** - `assertSameTenant` post-fetch checks on `getClientDetailForUser`, `getProjectDetailForUser`, `getInvoiceForUser`, `getTaskDetailForUser`; Postgres RLS available as a staged opt-in (`scripts/rls/`)

---

### Role-Based Access Control (RBAC)

Five predefined roles with granular permission flags:

| Role    | Description                        |
| ------- | ---------------------------------- |
| Owner   | Full access, billing, org deletion |
| Admin   | Team management, settings          |
| Manager | Project & task management          |
| Member  | Standard workspace access          |
| Client  | Read-only client portal access     |

Permissions enforced at API layer, service layer (via `resolveModulePermissionsForUser`), and UI visibility level.

---

### Project & Client Management

- Full **CRUD for clients** with detail pages and project associations
- Full **CRUD for projects** with budget tracking, status, and member access
- **Project templates** - create reusable project blueprints with pre-defined tasks
- **Project-level membership** - control who sees each project
- **Time entries** per project and task with full UI (filters, paginated list, log-time dialog)
- **File uploads** (Cloudinary) attached to projects and tasks

---

### Task Management (Kanban)

- **Kanban board** with drag-and-drop columns and cards (dnd-kit)
- Custom board columns with color coding and ordering
- Per-task: title, description, status, priority, due date, assignees, estimates
- **Subtasks** with individual completion tracking
- **Task comments** with rich text (Tiptap) and @mention notifications
- **File attachments** per task with signed URL delivery
- **Task activity log** - full change history with old/new values
- **Comment limit enforcement** per plan

---

### Billing & Subscriptions (Stripe)

- **Multi-plan support** (Starter, Professional) with feature flags and usage limits
- Stripe **Checkout** and **Customer Portal** integration
- **In-UI proration preview** before plan upgrade or downgrade - line-item breakdown via `/api/billing/preview-plan-change`
- **Mid-cycle plan changes** in either direction - upgrade flow charges the prorated difference now; downgrade flow applies prorated credit to the next invoice. Direction-aware copy in `PlanChangePreviewDialog` ("Upgrade plan" / "Downgrade plan" / "Change plan").
- **Trial period** management
- **Cancel-at-period-end** support
- **Usage counters** - members, projects, clients, tasks, comments, files tracked monthly
- **Plan limit enforcement** - 402 errors with upgrade prompts at quota boundaries
- **Invoice management** - Stripe automated invoices + manual invoices with line items
- **Stripe webhook processing** with idempotency key storage and event logging
- **Refund tracking** - `charge.refunded` updates `invoices.{status, refundedAt, amountRefundedCents, refundReason}` and dispatches outbound `invoice.refunded` event
- **Dunning cadence** - day 1 / 3 / 7 / 14 reminder sequence, idempotent stage walk, integrated with `daily-expirations` cron
- **Stripe circuit breaker** - in-process state machine (closed → open → half_open) with 5-failure threshold + 30 s cooldown; trips on 5xx / network / timeout; 4xx don't count. Stripe SDK timeout pinned to 10 s.
- **Billing email notifications** - payment failures, expiring cards, plan changes, overdue reminders

---

### India GST Capture

When `PLATFORM_GST_STATE_CODE` is set AND a customer org has a GSTIN AND the invoice currency is INR, every Stripe-paid invoice gets a GST snapshot at `invoice.paid` time:

- `subtotalCents` (tax-exclusive base, gross-to-net decomposed from the Stripe invoice amount)
- `taxBreakdown` JSONB - `{regime: "intra_state" | "inter_state", cgstCents, sgstCents, igstCents, totalTaxCents}`
- `gstinAtInvoice` - buyer's GSTIN at the time of payment
- `hsnSacCode` - 998314 (SaaS default)

Implementation at `lib/billing/india-gst.ts`. Customer GSTIN management at `/settings/gst`. The custom invoice PDF (`components/invoices/InvoicePDFDocument.tsx`) renders the GST breakdown for the buyer.

This module is intentionally independent of Stripe Tax - it works on any Stripe account regardless of the account's country, so a US-based Stripe account can still issue GST-formatted invoices to Indian B2B buyers.

---

### Notifications (Multi-Channel)

| Channel   | Implementation                               |
| --------- | -------------------------------------------- |
| In-App    | `notifications` table, unread badge, popover |
| Email     | 46 HTML templates via Resend or EmailJS      |
| Web Push  | VAPID-signed push subscriptions              |
| Real-Time | SSE stream via Upstash Redis pub/sub         |

- **Per-event preferences** - users control in-app and email per notification type
- **Per-category email preferences** - coarser product / billing / marketing opt-out (see Privacy & GDPR section)
- **Bulk preference updates**
- **30s polling fallback** when SSE is unavailable
- **Exponential backoff** reconnection for SSE in production

---

### Outbound Webhooks

- Organization-scoped webhook endpoints
- **12 event types**: `project.created/updated/deleted`, `task.created/updated/completed`, `client.created/updated`, `invoice.paid/overdue/refunded`, `team.member_added/removed`
- **HMAC-SHA256** signed payloads (`X-ClientFlow-Signature` header)
- **3 retry attempts** with exponential backoff (1s, 2s, 4s delays)
- **Outbound DLQ** - every dispatch logged to `outbound_webhook_deliveries` with status (`delivered` / `permanent_fail` / `exhausted`), attempt count, response status, and error
- **Admin replay UI** at `/admin/webhook-deliveries` for `exhausted` rows; 4xx classified as permanent (no replay)
- **Test delivery** button in the UI - sends live signed ping to endpoint
- Concurrent delivery via `Promise.allSettled`

### Inbound Webhooks

- **Stripe** - signature-verified, idempotent via `billing_webhook_events` table, processing errors recorded for observability. **Admin DLQ + replay UI** at `/admin/billing-webhook-events` for events that failed processing - the Stripe handlers are idempotent so a manual replay is safe.
- **Resend bounce / complaint webhook** at `/api/webhooks/resend` with manual Svix-style HMAC verification (5-min replay window, timing-safe compare). Hard bounces and complaints flow into `email_suppressions` and are honored on every subsequent send (critical modules bypass).

---

### Public REST API (`/api/v1`)

- **Strict `X-API-Key` authentication** via `requireV1Auth()` - no session-cookie fallback so third-party SDKs can't accidentally inherit a browser session
- **OpenAPI 3.1 spec** served at `/api/openapi.json` - importable into Postman / Insomnia / OpenAPI Generator
- **Idempotency-Key header** support on POST endpoints (24-hour cache, race-safe via unique index, `Idempotency-Replayed: true` response header on cache hit)
- **Per-API-key rate limit** - 1,000 req/min sliding window via Upstash; monthly usage counter surfaced to the customer in the API key UI
- Endpoints today:
  - `GET /api/v1/clients?limit=&offset=`
  - `POST /api/v1/clients` (with `Idempotency-Key`)
  - `GET /api/v1/projects?limit=&offset=`
  - `POST /api/v1/projects` (with `Idempotency-Key`)
  - `GET /api/v1/tasks?projectId=&status=&limit=&offset=`
  - `POST /api/v1/tasks` (with `Idempotency-Key`)
  - `GET /api/v1/invoices?status=&limit=&offset=`
- Pagination clamped server-side (limit 1-200, offset >= 0)
- Standard error shape `{error: string}` with appropriate HTTP status

### API Keys & Developer Access

- Organization-scoped API key generation
- SHA-256 hashed storage (key shown once at creation)
- Key prefix display for identification
- Expiration options (30 days / 90 days / 1 year / no expiry)
- Per-key revocation and deletion
- Last-used timestamp tracking
- **Monthly usage counter** per key (Redis-backed, surfaces as "Calls (this month)" column)
- **In-app API reference docs** at `/developer`

---

### Observability & Reliability

- **Public status page** at `/status` with live multi-service probes:
  - DB ping (`SELECT 1`)
  - Stripe `/v1/balance` (5 s timeout, soft-skipped without `STRIPE_SECRET_KEY`)
  - Resend `/domains` (5 s timeout, soft-skipped without `RESEND_API_KEY`)
  - 60 s ISR refresh; overall pill goes amber on any _monitored_ upstream failure
- **Liveness probe** at `/api/health` returning `{status, ts, version, region, db, latencyMs}` with 200 / 503
- **Sentry** with PII scrubbing, 10 % trace sampling in prod, webhook-body scrubbing in `beforeSend`
- **Structured logging** via `server/observability/logger.ts`
- **Request correlation IDs** - middleware mints `x-request-id` (or trusts Vercel's), forwards to handlers, echoes on response, stamped on every log line + Sentry tag
- **Email-send retry** - 3 attempts with jittered exponential backoff (250 ms / 1 s / 4 s)
- **Async email queue** (Inngest) - when `INNGEST_EVENT_KEY` is set, emails enqueue rather than send synchronously, decoupling Resend latency from the request path. Falls back to sync send when unset, so existing flows are unaffected.

---

### Cron Jobs

7 jobs defined in `vercel.json`, staggered UTC schedules, `maxDuration: 300`:

| Cron                       | Schedule     | Purpose                                                                                                               |
| -------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `task-notifications`       | Every hour   | Due-soon and overdue task notifications                                                                               |
| `support-sla-sweep`        | Every 15 min | Surface tickets approaching SLA breach                                                                                |
| `daily-expirations`        | 01:00 UTC    | Trial-expiry handling + dunning sweep (day 1 / 3 / 7 / 14)                                                            |
| `analytics-daily-rollup`   | 02:30 UTC    | Materialise daily org metrics                                                                                         |
| `nightly-housekeeping`     | 03:00 UTC    | Sessions purge + soft-delete purge + webhook event purge + Stripe reconciliation + GDPR anonymisation + log retention |
| `payment-method-reminders` | 09:00 UTC    | Card-expiring soon notifications                                                                                      |
| `monthly-rollover`         | 02:00 (1st)  | Reset usage counters at billing period boundary                                                                       |

Each cron is gated by `CRON_SECRET` (Bearer token) via `server/cron/guard.ts`. The `runCron(name, fn)` wrapper captures uncaught throws to Sentry with the cron name + duration tag, so silent failures show up in alerting.

---

### Audit & Activity Logs

- **Audit logs** - actor, action, entity type/ID, IP, user agent, metadata - admin-only, 365-day retention enforced via nightly housekeeping
- **Task audit logs** - field-level change history (oldValues / newValues)
- **Activity logs** - broader activity feed accessible to team members
- **Admin search/filter UI** at `/admin/audit-logs` - filter by actor (name or email, debounced), entity type, date range, search by action / entity type / entity ID
- **CSV export** for both audit and activity logs
- Audit-logged actions include: `user.data_export_requested`, `user.deletion_scheduled/cancelled`, `user.email_preferences_updated`, `replay_webhook_delivery`, `replay_billing_webhook_event`, `org.gst_settings_updated`, `feature_flag.toggled`

---

### Analytics & Feature Flags

- **PostHog** integrated as a **consent-gated** provider (`components/analytics/PostHogProvider.tsx`) - reads `cf_consent` cookie on mount, listens to `cf:consent-updated` events to switch state when the user toggles consent later
- Manual `$pageview` on every App Router navigation
- Session recording disabled by default
- **5 activation funnel events** firing end-to-end:
  - `sign_up_started` (client - email & Google)
  - `sign_up_done` (client)
  - `first_project_created` (server - on `projectCount === 1`)
  - `first_invoice_paid` (server - on `paidCount === 1` from Stripe webhook)
  - `plan_upgraded` (server - on `customer.subscription.updated` price change)
- **In-house feature flag system** (`lib/feature-flags.ts` + `feature_flags` + `feature_flag_overrides` tables):
  - Two-tier evaluation: per-org override wins over global default
  - Bulk variant for fetching all flags for an org in one round-trip
  - 60 s in-process cache
  - **Admin UI at `/admin/feature-flags`** - global toggles + per-org override management; toggles audit-logged

---

### Analytics Dashboard

- Total clients, active projects, completed projects, files, revenue
- Projects by status breakdown
- Monthly project creation trend
- Monthly revenue trend (currency-aware)
- Recent project activity feed
- Client-scoped filtering

---

### Knowledge Base & Help Center

- **Real article content** (not stub copy) at `/help` - 11 articles covering workspace setup, team invitations, first client, Kanban best practices, invoice anatomy + India GST, plan changes/cancellation, 2FA, API key management, GDPR export/deletion, webhook configuration, and email troubleshooting
- Article content lives in `config/kb-articles.ts` (typed Markdown, ships with the deployment)
- Per-article static pages at `/help/[slug]` rendered with `react-markdown` + `remark-gfm`, full SEO metadata, `generateStaticParams` for pre-rendering
- Browse-by-category index with **client-side search** across titles + excerpts

---

### Client Portal

A separate, role-gated interface for external clients:

- `/client-portal` - Summary dashboard
- `/client-portal/projects` - Read-only project list and details
- `/client-portal/tasks` - Read-only task list
- `/client-portal/files` - Access to shared project files
- `/client-portal/invoices` - View and download invoices

Portal inherits org branding (logo, brand color).

---

### Email System

Dual-provider routing: **EmailJS** when `EMAILJS_PUBLIC_KEY` is set, otherwise **Resend**.

When `INNGEST_EVENT_KEY` is set, `sendEmail()` enqueues to Inngest and returns immediately - the actual provider call happens in a queued worker (`server/queue/functions/send-email.ts`). Without Inngest configured, the call is synchronous (existing behaviour preserved).

46 HTML templates across categories:

| Category       | Templates                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Auth           | Verify email, password reset, **sign-in OTP**, invite, invite expired/revoked, suspicious login, membership suspended                  |
| Organization   | Role changed, account status changed, ownership transfer                                                                               |
| Tasks          | Assigned, status changed, comment added, mentioned, due soon, overdue, attachment added                                                |
| Billing        | Subscription changed, invoice available/overdue, payment failed/method expiring/changed, usage warning, quota reached, upgrade request |
| Security       | Session activity notice, forced logout notice                                                                                          |
| Operations     | Export ready, webhook failures, API key exposure, rate limit abuse, event/billing delays                                               |
| Files & Portal | Shared file uploaded, client portal enabled                                                                                            |
| Public         | Contact form acknowledgement, internal submission                                                                                      |

Every outbound email carries a signed unsubscribe footer (HMAC-SHA256). Suppression and per-category opt-out checks happen before send; critical modules (auth / billing / security) bypass both.

---

### Global Search & Command Palette

- **⌘K command palette** (cmdk-based) with grouped sections:
  - **Create** shortcuts - New Client, New Project, Invite Teammate, New Invoice
  - **Search results** - clients, projects, tasks (real data via `/api/search`)
  - **Recent history** (localStorage)
  - **Quick navigation** - all sidebar destinations
- **Keyboard-shortcut help modal** - press `?` anywhere to see all shortcuts
- **G-chord navigation** - `g d` (Dashboard), `g c` (Clients), `g p` (Projects), `g t` (Tasks), `g i` (Invoices); skips when target is editable

---

### Testing

- **Vitest** unit tests with `@testing-library/react` + `vitest-axe` matchers
- **Playwright** E2E suite (~9 specs covering auth, projects, tasks, invoices, clients, settings, org-security)
- **Accessibility tests** - `jest-axe` smoke suite on UI primitives + Playwright a11y specs (`a11y-public.spec.ts`, `a11y-protected.spec.ts`) using `@axe-core/playwright`
- **Lighthouse CI** workflow runs on every PR + nightly against `main`. Captures LCP / INP / CLS / TBT / Web Vitals against budgets defined in `.lighthouserc.json`. Non-blocking; results uploaded to LHCI temporary public storage.

---

### CI/CD & DevEx

- **GitHub Actions** - typecheck + lint + Vitest + build + bundle-size budget + `npm audit` on every PR and push to main
- **Bundle-size budget gate** - `scripts/bundle-budget.mjs` reads `.next/app-build-manifest.json`, sums each route's JS chunks, fails the build at 450 KB / route by default (per-route override map at the top of the script)
- **Lighthouse CI** for performance regressions (see Testing)
- **Dependabot** - weekly Monday cadence for npm + GitHub Actions, separate prod / dev groups, ignores Next/React major bumps (need coordinated upgrades)
- **Husky + lint-staged + Prettier** with Tailwind plugin
- **Conventional Commits** enforced via `commitlint` and the `.husky/commit-msg` hook
- `CHANGELOG.md` (Keep-a-Changelog format) and `.github/pull_request_template.md`
- See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for local setup, branching, commit conventions, and PR process

---

## Database Schema

PostgreSQL via Neon. Managed with Drizzle ORM.

**Tenant safety:** child records use composite tenant-scoped foreign keys (e.g. `(organization_id, project_id)`) to block cross-tenant references at the database level. Application-layer `assertSameTenant` checks add a defence-in-depth layer in detail fetchers. Postgres RLS policies are pre-written in `scripts/rls/01-create-policies.sql` and ship inert; enable via the staged plan in `scripts/rls/README.md` when ready.

**Schema domains:**

| Domain   | Key Tables                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Access   | `organizations`, `organization_settings`, `organization_memberships`, `organization_invitations`, `roles`, `permissions`, `role_permissions`, `api_keys`, `outbound_webhooks`, `outbound_webhook_deliveries`                                                       |
| Work     | `clients`, `projects`, `project_files`, `project_members`, `project_templates`, `task_board_columns`, `tasks`, `task_comments`, `task_attachments`, `task_audit_logs`, `task_assignees`, `time_entries`                                                            |
| Billing  | `plans`, `plan_feature_limits`, `subscriptions`, `organization_current_subscriptions`, `invoices` (incl. India GST snapshot fields), `usage_counters`, `billing_webhook_events`, `api_idempotency_keys`                                                            |
| Platform | `notifications`, `notification_deliveries`, `notification_preferences`, `email_suppressions`, `email_category_preferences`, `push_subscriptions`, `feature_flags`, `feature_flag_overrides`, `analytics_daily_org_metrics`, `audit_logs`, `platform_admin_actions` |
| Support  | `support_tickets`, `support_messages`                                                                                                                                                                                                                              |

**Migrations:** managed via `drizzle-kit`. The convention is documented in [`drizzle/README.md`](./drizzle/README.md) - prefer semantic names (`add_invoice_tax_breakdown`) over auto-generated ones; this is a code-review rule, not enforced.

---

## Environment Variables

See [`.env.example`](./.env.example) for the full annotated list with operator-config notes. Headline groups:

```bash
# ─── Core app ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=
BETTER_AUTH_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION=

# ─── Database ──────────────────────────────────────────────────────────────
NEON_DATABASE_URL=

# ─── Rate limiting (Upstash Redis) - REQUIRED ──────────────────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_REDIS_URL=                # ioredis TCP for SSE pub/sub

# ─── File storage (Cloudinary) ─────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ─── Email delivery ────────────────────────────────────────────────────────
RESEND_API_KEY=
EMAIL_FROM=
RESEND_REPLY_TO_EMAIL=
RESEND_WEBHOOK_SECRET=            # Svix-style HMAC for bounce/complaint webhook
# Optional EmailJS (takes priority over Resend when set)
EMAILJS_PUBLIC_KEY=
EMAILJS_PRIVATE_KEY=
EMAILJS_SERVICE_ID=
EMAILJS_TEMPLATE_ID=
EMAILJS_TRANSACTIONAL_TEMPLATE_ID=

# ─── Web Push ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

# ─── OAuth (optional) ──────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ─── Stripe ────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID_STARTER=
STRIPE_PRICE_ID_PROFESSIONAL=
STRIPE_WEBHOOK_SECRET=

# ─── Bot protection (Cloudflare Turnstile) ─────────────────────────────────
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# ─── Product analytics (PostHog) ───────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=          # phc_… project key (NOT a personal API key)
NEXT_PUBLIC_POSTHOG_HOST=

# ─── India GST (optional, only for B2B India) ──────────────────────────────
PLATFORM_GST_STATE_CODE=          # Two-digit state code (e.g. "27" Maharashtra)

# ─── Async background jobs (Inngest, optional) ─────────────────────────────
INNGEST_EVENT_KEY=                # When set, emails enqueue instead of sending sync
INNGEST_SIGNING_KEY=

# ─── Security (CSP rollback switch, leave unset normally) ──────────────────
CSP_REPORT_ONLY=                  # Set to "1" only as emergency rollback

# ─── Cron jobs ─────────────────────────────────────────────────────────────
CRON_SECRET=                      # Bearer token guarding /api/cron/*

# ─── Error tracking ────────────────────────────────────────────────────────
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## Local Setup

```bash
# 1. Install
npm install

# 2. Copy env template and fill in values
cp .env.example .env

# 3. Generate auth schema, run migrations, seed roles + plans
npm run db:setup
npm run db:seed:roles
npm run db:seed:plans
npm run db:seed:platform-admin

# 4. Start dev server
npm run dev
```

Common scripts:

| Script                                          | Purpose                                 |
| ----------------------------------------------- | --------------------------------------- |
| `npm run dev`                                   | Start Next.js dev server                |
| `npm run typecheck`                             | Run `tsc --noEmit`                      |
| `npm run lint`                                  | Run ESLint                              |
| `npm test`                                      | Run Vitest unit tests                   |
| `npm run test:e2e`                              | Run Playwright E2E suite                |
| `npm run build`                                 | Production build                        |
| `npm run bundle:budget`                         | Per-route bundle-size gate (post-build) |
| `npm run analyze`                               | Build with bundle analyzer              |
| `npm run db:generate -- --name <semantic_name>` | Generate a new Drizzle migration        |
| `npm run db:migrate`                            | Apply pending migrations                |
| `npm run db:studio`                             | Open Drizzle Studio                     |

---

## Deployment

**Platform:** Vercel (serverless)
**Database:** Neon PostgreSQL
**Cache / Pub-Sub:** Upstash Redis
**File Storage:** Cloudinary
**Domain:** client-flow.in (GoDaddy → Vercel DNS)

Per-route function configuration in [`vercel.json`](./vercel.json):

- `regions: ["bom1"]` (Mumbai pinning for the India audience)
- `functions.maxDuration` per route family (30 s billing webhook, 60 s PDF/exports, 300 s crons)
- 7 cron schedules (see Cron Jobs section)

The app is stateless by design - all session state, pub/sub, and rate-limit state live in Upstash Redis. Horizontal scaling requires no additional configuration.

---

## System Design Notes

**Multi-tenancy:** Shared database, tenant-scoped queries. Every primary table has `organization_id`; high-traffic detail fetchers add `assertSameTenant` post-fetch as a defence-in-depth layer. Composite indexes on `(organization_id, created_at)` and similar patterns. Postgres RLS policies are pre-written and ship inert - enable via the staged plan in `scripts/rls/README.md`.

**Event-driven internals:** Domain events table captures business events. A job queue handles asynchronous work (notification delivery, webhook dispatch) with deduplication, scheduling, and distributed locking. The Inngest queue (when configured) handles email send asynchronously so a slow Resend doesn't propagate into request latency.

**Billing isolation:** Billing logic is contained in its own schema domain and service files, structurally ready for extraction into an independent service. The Stripe circuit breaker at `server/third-party/stripe.ts` keeps a degraded Stripe API from exhausting function-time budget across the rest of the app.

**Email provider flexibility:** A single `sendEmail()` function routes to EmailJS or Resend based on environment configuration - no call sites need to change when switching providers. Suppression and per-category opt-out checks happen before send; critical modules (auth / billing / security) bypass both. With Inngest configured, `sendEmail()` enqueues; the worker calls `sendEmailNow()` which runs the same checks.

**SSE + polling:** Real-time notification delivery via SSE with Redis pub/sub in production. A 30-second polling fallback in `useNotifications` ensures notifications are never missed if SSE is unavailable.

**Security layers:** Rate limiting at middleware (per-IP + per-API-key), RBAC at service layer, tenant scoping at query layer, defence-in-depth tenant assertions in detail fetchers, optional Postgres RLS as a fourth layer, HMAC signing on webhooks (in and out), hashed storage for API keys, composite FK constraints at database layer, full security-header set including enforcing CSP.

**Observability:** Request correlation IDs forwarded across handlers and stamped on every log line and Sentry event. Structured logger. Sentry with PII scrubbing and 10 % trace sampling in production. Public status page probes DB + Stripe + Resend with neutral "unmonitored" pills when API keys are absent. Cron failures captured to Sentry via `runCron` wrapper with the cron name + duration tag.

---

## Documentation

| Document                                                                                             | Purpose                                                  |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`docs/production-readiness-audit-scope.md`](./docs/production-readiness-audit-scope.md)             | The 32-category audit framework                          |
| [`docs/production-readiness-report.md`](./docs/production-readiness-report.md)                       | v1 audit (75 % overall)                                  |
| [`docs/production-readiness-report-v2.md`](./docs/production-readiness-report-v2.md)                 | v2 audit (87 % overall)                                  |
| [`docs/production-readiness-report-v3.md`](./docs/production-readiness-report-v3.md)                 | **v3 audit (90 % overall)** - latest scorecard           |
| [`docs/production-readiness-roadmap-to-100.md`](./docs/production-readiness-roadmap-to-100.md)       | Sequenced roadmap to ~96 % (code) / ~98 % (with vendors) |
| [`docs/vercel-resend-infrastructure-checklist.md`](./docs/vercel-resend-infrastructure-checklist.md) | Stack-specific operator checklist                        |
| [`scripts/rls/README.md`](./scripts/rls/README.md)                                                   | Postgres RLS staged-rollout plan                         |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md)                                                               | Local setup, branching, commits, PR process              |
| [`CHANGELOG.md`](./CHANGELOG.md)                                                                     | Release history (Keep-a-Changelog format)                |
| [`drizzle/README.md`](./drizzle/README.md)                                                           | Migration naming convention and review procedure         |
