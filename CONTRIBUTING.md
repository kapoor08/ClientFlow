# Contributing to ClientFlow

Thanks for the interest. This doc is the short version of how we work day to
day - what to install, how to make a change, and how to get it merged.

## 1. Local setup

```bash
git clone <repo>
cd clientflow
npm install
cp .env.example .env.local        # then fill the secrets - see comments inside
npm run auth:generate              # regenerates Better Auth's typed schema
npm run db:migrate                 # applies any pending migrations
npm run dev                        # http://localhost:3000
```

You need:

- **Node 20+** (matches CI; use `nvm use` if you have nvm).
- **A Postgres database.** Neon's free tier is what we run against; any
  vanilla Postgres 15+ works locally.
- **Stripe / Resend / Sentry / Upstash / Turnstile / PostHog** API keys
  are all _optional_ for local dev - the code soft-skips when they're
  unset. Production needs them all; see `.env.example` for which ones.

## 2. Branching

- `main` is always deployable. Direct pushes are blocked.
- Branch off `main` for everything: `feat/short-name`, `fix/short-name`,
  `chore/short-name`. The prefix matches the commit type (see below).
- Keep branches short-lived. Open the PR while the work is still small.

## 3. Commits

We use **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`,
`docs:`, `test:`, `perf:`, `build:`, `ci:`). commitlint runs in a Husky
`commit-msg` hook and rejects anything that doesn't parse.

Examples:

```
feat(billing): in-app proration preview before plan upgrade
fix(webhook): clear dunning state on invoice re-pay
refactor(time-entries): extract org-wide listing into server module
chore(deps): bump posthog-js to 1.234.0
```

Optional `BREAKING CHANGE:` footer when the change moves a public surface
(API path, response shape, env var rename).

## 4. The gate

Every PR must pass:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`.github/workflows/ci.yml` runs all four. `npm run test:e2e` (Playwright)
is opt-in - it needs a running dev server and a clean DB, so we don't gate
PRs on it. Run it locally before any change to auth / billing / multi-tenant
code.

Husky also runs `lint-staged` on `git commit` (Prettier + ESLint --fix on
staged files), and `commit-msg` validates the commit message format.

## 5. PR process

- One PR = one logical change. No drive-by refactors.
- Title in Conventional-Commit form (the squash commit reuses it).
- Fill the template - "what changed", "why", and the test plan.
- Mark the relevant Type-of-change checkbox in the template.
- Touch DB schema → ran `npm run db:generate -- --name <semantic>` and
  committed both the schema and the migration. See `drizzle/README.md`.
- Touch billing / auth / multi-tenant → say so in the PR body, and add a
  manual-test note for the affected flow.
- Touch public-API surface → bump or add to `app/api/v1/openapi/route.ts`.

## 6. Architectural rules

`/.claude/CLAUDE.md` has the longer version. The TL;DR:

- **Server Components by default.** `"use client"` only when you need
  state, handlers, or browser APIs.
- **Pages are thin.** A page should fetch + compose; UI lives in
  `components/`.
- **Multi-tenant boundary is sacred.** Every org-scoped query filters by
  `organizationId`. Detail fetchers also call `assertSameTenant` as a
  defence-in-depth check (`server/auth/tenant-guard.ts`).
- **Migrations are semantic.** `npm run db:generate` refuses to run
  without a `--name` flag (see `scripts/db-generate-guard.mjs`).
- **No emojis in code or commits.**

## 7. Reporting bugs

Open a GitHub issue with:

- A short repro (one paragraph or a code snippet).
- What you expected vs. what happened.
- Browser / Node / OS if relevant.
- Sentry event ID if you have one (the request-id middleware stamps every
  log line + Sentry tag with `x-request-id`, and the same ID is echoed on
  the response).

## 8. Security disclosures

**Do not file public issues for security findings.** Email the maintainer
(see `package.json` author field) with the vulnerability and a repro.

---

Last updated when shipping the production-readiness P2 stretch.
