# ClientFlow

### Production-Grade Multi-Tenant SaaS Platform for Agencies & Service-Based Businesses

---

## Overview

ClientFlow is a fully-featured, multi-tenant SaaS platform built for agencies, consultants, and service teams to manage clients, projects, tasks, billing, files, and collaboration from a single system.

The platform is built to production standards - not as a demo. It demonstrates real-world SaaS engineering: strict tenant isolation, subscription monetization, event-driven processing, multi-channel notifications, external integrations, and a white-label client portal.

**Live:** [client-flow.in](https://client-flow.in)

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

### Backend

| Layer              | Technology                          |
| ------------------ | ----------------------------------- |
| API                | Next.js Route Handlers              |
| Auth               | BetterAuth v1.5                     |
| Database           | PostgreSQL (Neon serverless)        |
| ORM                | Drizzle ORM                         |
| Cache / Pub-Sub    | Upstash Redis (REST + ioredis TCP)  |
| Rate Limiting      | @upstash/ratelimit (sliding window) |
| Payments           | Stripe v20                          |
| Email              | Resend / EmailJS (dual-provider)    |
| File Storage       | Cloudinary                          |
| Push Notifications | Web Push (VAPID)                    |
| Real-Time          | Server-Sent Events (SSE)            |

---

## Architecture

ClientFlow uses a **modular monolith** with a shared-database, tenant-scoped multi-tenancy model. Every primary table carries an `organization_id`. All queries are tenant-scoped at the service layer - there is no cross-tenant data leakage.

```
app/
├── (public)/          # Marketing, pricing, legal, docs
├── (protected)/       # Authenticated workspace + client portal
├── (onboarding)/      # New-user onboarding flow
├── auth/              # Auth pages (sign-in, sign-up, MFA, SSO)
├── api/               # Route handlers
│
core/                  # Use-cases per domain (framework-agnostic)
lib/                   # Shared utilities, service functions
db/
├── schemas/           # Drizzle schema files per domain
│   ├── access.ts      # Orgs, roles, memberships, permissions
│   ├── work.ts        # Clients, projects, tasks, time entries
│   ├── billing.ts     # Plans, subscriptions, invoices, usage
│   └── platform.ts    # Events, jobs, notifications
emails/templates/      # 43 HTML email templates
```

---

## Features

### Authentication & Security

- **Email / Password** authentication via BetterAuth
- **Google OAuth** (configurable)
- **Two-Factor Authentication (TOTP)** with backup code regeneration
- **Single Sign-On (SSO)** - OIDC/SAML, Google Workspace, Azure AD, Okta
- **SSO enforcement** per organization (blocks non-SSO logins when enabled)
- **Session management** - configurable timeout, per-session revocation, revoke-all
- **IP allowlist** enforcement at middleware level
- **Risky sign-in detection** with email alerts
- **Rate limiting** - 10 req/10s on auth endpoints, 120 req/60s on all API routes (Upstash sliding window)

---

### Multi-Tenant Organization System

- Users can belong to multiple organizations with independent roles
- **Organization switcher** in the app header
- Per-organization **settings**: logo, brand color, timezone, currency, session timeout, SSO config, IP allowlist
- **White-label branding** - brand color propagates across the full UI (buttons, badges, sidebar, backgrounds, gradients) via server-injected CSS variable overrides
- **Custom role permissions** - per-role feature access configurable by org admins
- **Member permission overrides** - individual permission exceptions per member

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

Permissions enforced at API layer, service layer, and UI visibility level.

---

### Project & Client Management

- Full **CRUD for clients** with detail pages and project associations
- Full **CRUD for projects** with budget tracking, status, and member access
- **Project templates** - create reusable project blueprints with pre-defined tasks
- **Project-level membership** - control who sees each project
- **Time entries** per project and task
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
- **Trial period** management
- **Cancel-at-period-end** support
- **Usage counters** - members, projects, clients, tasks, comments, files tracked monthly
- **Plan limit enforcement** - 402 errors with upgrade prompts at quota boundaries
- **Invoice management** - Stripe automated invoices + manual invoices with line items
- **Stripe webhook processing** with idempotency key storage and event logging
- **Billing email notifications** - payment failures, expiring cards, plan changes, overdue reminders

---

### Notifications (Multi-Channel)

| Channel   | Implementation                               |
| --------- | -------------------------------------------- |
| In-App    | `notifications` table, unread badge, popover |
| Email     | 43 HTML templates via Resend or EmailJS      |
| Web Push  | VAPID-signed push subscriptions              |
| Real-Time | SSE stream via Upstash Redis pub/sub         |

- **Per-event preferences** - users control in-app and email per notification type
- **Bulk preference updates**
- **30s polling fallback** when SSE is unavailable
- **Exponential backoff** reconnection for SSE in production

---

### Outbound Webhooks

- Organization-scoped webhook endpoints
- **12 event types**: `project.created/updated/deleted`, `task.created/updated/completed`, `client.created/updated`, `invoice.paid/overdue`, `team.member_added/removed`
- **HMAC-SHA256** signed payloads (`X-ClientFlow-Signature` header)
- **3 retry attempts** with exponential backoff (1s, 2s, 4s delays)
- **Test delivery** button in the UI - sends live signed ping to endpoint
- Concurrent delivery via `Promise.allSettled`

---

### API Keys & Developer Access

- Organization-scoped API key generation
- SHA-256 hashed storage (key shown once at creation)
- Key prefix display for identification
- Expiration options (30 days / 90 days / 1 year / no expiry)
- Per-key revocation and deletion
- Last-used timestamp tracking
- **In-app API reference docs** at `/developer`

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

### Audit & Activity Logs

- **Audit logs** - actor, action, entity type/ID, IP, user agent, metadata - admin-only
- **Task audit logs** - field-level change history (oldValues / newValues)
- **Activity logs** - broader activity feed accessible to team members
- Date range filtering, search by action and entity
- **CSV export** for both audit and activity logs

---

### Analytics Dashboard

- Total clients, active projects, completed projects, files, revenue
- Projects by status breakdown
- Monthly project creation trend
- Monthly revenue trend (currency-aware)
- Recent project activity feed
- Client-scoped filtering

---

### Email System

Dual-provider routing: **EmailJS** when `EMAILJS_PUBLIC_KEY` is set, otherwise **Resend**.

43 HTML templates across categories:

| Category       | Templates                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Auth           | Verify email, password reset, invite, invite expired/revoked, suspicious login, membership suspended                                   |
| Organization   | Role changed, account status changed, ownership transfer                                                                               |
| Tasks          | Assigned, status changed, comment added, mentioned, due soon, overdue, attachment added                                                |
| Billing        | Subscription changed, invoice available/overdue, payment failed/method expiring/changed, usage warning, quota reached, upgrade request |
| Security       | Session activity notice, forced logout notice                                                                                          |
| Operations     | Export ready, webhook failures, API key exposure, rate limit abuse, event/billing delays                                               |
| Files & Portal | Shared file uploaded, client portal enabled                                                                                            |
| Public         | Contact form acknowledgement, internal submission                                                                                      |

---

### Global Search

- Unified search across clients, projects, tasks
- Command palette UI (cmdk)
- Results grouped by entity type

---

## Database Schema

PostgreSQL via Neon. Managed with Drizzle ORM.

**Tenant safety:** child records use composite tenant-scoped foreign keys (e.g. `(organization_id, project_id)`) to block cross-tenant references at the database level.

**Schema domains:**

| Domain   | Key Tables                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access   | `organizations`, `organization_settings`, `organization_memberships`, `organization_invitations`, `roles`, `permissions`, `role_permissions`, `api_keys`, `outbound_webhooks`                           |
| Work     | `clients`, `projects`, `project_files`, `project_members`, `project_templates`, `task_board_columns`, `tasks`, `task_comments`, `task_attachments`, `task_audit_logs`, `task_assignees`, `time_entries` |
| Billing  | `plans`, `plan_feature_flags`, `plan_feature_limits`, `subscriptions`, `organization_current_subscriptions`, `invoices`, `usage_counters`, `billing_webhook_events`, `api_idempotency_keys`             |
| Platform | `domain_events`, `job_queue`, `notifications`, `notification_deliveries`, `notification_preferences`, `push_subscriptions`                                                                              |

---

## Environment Variables

```bash
# App
NEXT_PUBLIC_APP_URL=

# Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Database
DATABASE_URL=

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email - Resend (primary when EMAILJS keys are absent)
RESEND_API_KEY=
EMAIL_FROM=

# Email - EmailJS (optional, takes priority over Resend when set)
EMAILJS_PUBLIC_KEY=
EMAILJS_PRIVATE_KEY=
EMAILJS_SERVICE_ID=
EMAILJS_TEMPLATE_ID=
EMAILJS_TRANSACTIONAL_TEMPLATE_ID=
RESEND_REPLY_TO_EMAIL=

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID_STARTER=
STRIPE_PRICE_ID_PROFESSIONAL=
STRIPE_WEBHOOK_SECRET=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_REDIS_URL=
```

---

## Deployment

**Platform:** Vercel (serverless)
**Database:** Neon PostgreSQL
**Cache / Pub-Sub:** Upstash Redis
**File Storage:** Cloudinary
**Domain:** client-flow.in (GoDaddy → Vercel DNS)

The app is stateless by design - all session state, pub/sub, and rate limit state live in Upstash Redis. Horizontal scaling requires no additional configuration.

---

## System Design Notes

**Multi-tenancy:** Shared database, tenant-scoped queries. Cost-efficient, predictable performance with composite indexes on `(organization_id, created_at)` and similar patterns.

**Event-driven internals:** Domain events table captures business events. A job queue handles asynchronous work (notification delivery, webhook dispatch) with deduplication, scheduling, and distributed locking.

**Billing isolation:** Billing logic is contained in its own schema domain and service files, structurally ready for extraction into an independent service.

**Email provider flexibility:** A single `sendEmail()` function routes to EmailJS or Resend based on environment configuration - no call sites need to change when switching providers.

**SSE + polling:** Real-time notification delivery via SSE with Redis pub/sub in production. A 30-second polling fallback in `useNotifications` ensures notifications are never missed if SSE is unavailable.

**Security layers:** Rate limiting at middleware, RBAC at service layer, tenant scoping at query layer, HMAC signing on webhooks, hashed storage for API keys, composite FK constraints at database layer.
