# Changelog

All notable changes to ClientFlow are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- India GST capture & invoice tagging:
  - `lib/billing/india-gst.ts` calculator with `calculateGst`,
    `calculateGstFromGross`, GSTIN validation, and HSN/SAC code constants.
    Intra-state supplies split into CGST + SGST (rounding-safe so the two
    halves always sum to the IGST equivalent); inter-state supplies apply
    full IGST. SaaS HSN/SAC code 998314 at 18 %.
  - Org-level fields `organizations.gstin`, `gstStateCode`, `gstLegalName`
    plus a "India GST registration" section in `/settings` (admin-only).
    `POST /api/settings/gst` validates the GSTIN format, derives the state
    code from the first two digits, and audit-logs the change.
  - Invoice fields `invoices.subtotalCents`, `taxBreakdown` (jsonb),
    `gstinAtInvoice`, `hsnSacCode`. `handleInvoicePaid` now populates these
    from the gross amount when `PLATFORM_GST_STATE_CODE` is set, the org has
    a GSTIN on file, and the currency is INR. Snapshots are intentional: the
    historical record stays correct even if the org later edits its GSTIN.
  - 12 vitest tests in `tests/unit/india-gst.test.ts`.
  - New env var: `PLATFORM_GST_STATE_CODE`.
- `/time-tracking` top-level page with cross-project entry table, filters
  (project, date range), summary cards (this week / 30 days / all time), and
  a "Log time" CTA. `LogTimeDialog` now also accepts no `projectId` and
  shows a project picker when invoked from outside a project context.
  Server-side: `listTimeEntriesForOrg`, `getOrgTimeSummary`. API: `GET
/api/time-entries?scope=org` (existing task / project drawer behaviour
  unchanged). Sidebar gains a "Time Tracking" entry under Work Management.
- Playwright E2E expansion: `clients.spec.ts`, `settings.spec.ts`,
  `org-security.spec.ts` cover the previously-untested user journeys called
  out in the v2 audit. `playwright.config.ts` now routes these through the
  authenticated project (reuses `.auth-state.json`).
- Page-level accessibility scans via `@axe-core/playwright`:
  `a11y-public.spec.ts` covers `/`, `/pricing`, `/features`, `/contact`,
  `/auth/sign-in`, `/auth/sign-up`; `a11y-protected.spec.ts` covers the eight
  primary authenticated pages. `color-contrast` and `region` rules are
  skipped pending a design-system pass; everything else fails the test on
  any violation.
- In-app proration preview before plan changes. Existing subscribers picking a
  different plan from the billing dialog now see a "Due today" amount, a
  proration breakdown, and the next-billing date sourced from
  `stripe.invoices.upcoming`. Confirming applies the change via
  `stripe.subscriptions.update` with `create_prorations`. Net-new signups
  still go through the checkout flow unchanged.
- `/admin/billing-webhook-events` admin UI: lists every inbound Stripe event,
  filtered by default to rows with a `processingError`. One-click replay
  re-runs the same dispatcher the live webhook route uses, then clears the
  error and stamps `processedAt` on success (or overwrites the error with
  the new failure on retry). Replay action is audit-logged.
- `server/billing/event-handlers.ts`: extracted from
  `app/api/billing/webhook/route.ts`. The route file is now a thin shell
  (signature verification, idempotency, persist, dispatch); all event-type
  handlers live in the new module behind a single `dispatchBillingEvent`
  entry point that both the live route and the admin replay share.
- `/admin/feature-flags` admin UI: lists every canonical `FEATURE_FLAG_KEYS`
  entry (flagging unseeded keys), inline switch flips the global default,
  per-org overrides managed in a dialog with a typeahead org picker. All
  writes are audit-logged to `platformAdminActions` and bust the in-process
  flag cache.
- Activation funnel events fired to PostHog: `sign_up_started` and
  `sign_up_done` (client, consent-gated), `first_project_created`,
  `first_invoice_paid`, and `plan_upgraded` (server, keyed off
  `org:<organizationId>` to avoid leaking per-user identity from webhook
  contexts). Server captures use a 2s-bounded `fetch` to PostHog's ingest
  endpoint - no new SDK dependency, never blocks the parent request.
- Production-readiness P1: CI workflow, Husky/lint-staged/Prettier, PostHog
  product analytics (consent-gated), DB-backed feature flags, retry-with-backoff
  on outbound email, dead-letter queue for outbound webhooks with admin replay,
  Cloudflare Turnstile bot protection on contact / sign-up / forgot-password,
  per-route `error.tsx` boundaries, missing `loading.tsx` skeletons, dunning
  cadence (day 1/3/7/14), Stripe refund webhook handler, request-correlation IDs
  across logs, password complexity (uppercase + lowercase + number + symbol),
  per-account sign-in lockout, jest-axe a11y smoke suite.
- Production-readiness P2: shared `Breadcrumbs` wrapper, sidebar collapse
  state persisted to localStorage, `@next/bundle-analyzer` wired behind
  `ANALYZE=true`.
- Database indexes: `subscriptions.organizationId`, `subscriptions.stripeSubscriptionId`,
  `invoices.organizationId`, `invoices.subscriptionId`, `invoices.externalInvoiceId`,
  `invoices.(status, dunningStage)`.

### Changed

- Stripe SDK now uses an explicit 10s timeout (down from the SDK default of
  80s) and `maxNetworkRetries: 2` for transient network errors.
- User-facing Stripe call sites (checkout, billing portal, webhook subscription
  retrieve, admin invoice retrieve, admin refund) are wrapped in an in-process
  circuit breaker. After 5 availability failures (5xx / connection errors)
  the breaker opens for 30s and short-circuits subsequent calls with a 503
  instead of hanging until timeout. 4xx errors do not count toward tripping.
- `sendEmail` now retries 3× with exponential backoff (250ms / 1s / 4s + jitter)
  before giving up.
- Stripe `invoice.paid` handler now updates an existing invoice row in place
  rather than skipping the conflict - clears dunning state on re-payment.
- `app/error.tsx` and `global-error.tsx` continue to back-stop everything;
  per-segment boundaries scope failures to the affected page.

### Removed

- `rateLimitBuckets` schema table (was never queried; per-IP limits live in
  Upstash via `server/rate-limit.ts`).

## [0.1.0] - 2026-04-22

Initial preview release.
