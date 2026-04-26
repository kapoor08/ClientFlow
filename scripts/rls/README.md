# Postgres Row-Level Security (RLS)

Defence-in-depth at the database layer. The application already filters by
`organizationId` on every query and re-asserts via `assertSameTenant` in the
high-traffic detail fetchers. RLS adds a third layer: even if a future
refactor accidentally drops a WHERE clause, the database will refuse to
return cross-tenant rows.

**This is opt-in.** The scripts in this folder are NOT part of the Drizzle
migration journal. They have to be applied by hand, in order, when you're
ready to enable RLS.

## Why staged

Enabling RLS in one step is the fastest way to take production down. A
single missed `SET LOCAL` call in any code path becomes "the table appears
empty" everywhere. The four-stage rollout below de-risks it.

## Stages

### Stage 0 (current state) - nothing enabled

The application runs without RLS. Every query filters by `organizationId`
in WHERE clauses. This is the baseline.

### Stage 1 - install policies (inert)

```bash
psql $DATABASE_URL < scripts/rls/01-create-policies.sql
```

Creates policies on every tenant-scoped table but does NOT enable RLS on the
tables. Policies are inert; existing app behavior unchanged. Safe to deploy.

**Verify:** `\dp clients` should show policies listed but the row should
not have `RLS` in the access privileges. App should behave identically.

### Stage 2 - wire `setTenantContext()` into every authenticated handler

In application code, ensure every transaction that touches tenant data
calls `setTenantContext(orgId)` first - see `server/db/with-tenant.ts`.

This step has zero observable effect because RLS is still disabled. But it
sets up the GUC value that the policies will read at Stage 3.

**Verify:** add a temporary `SHOW app.current_org_id;` query inside an
authenticated request handler and confirm it returns the active org's ID.

### Stage 3 - enable RLS on low-risk tables first

```bash
# Start with read-heavy tables that don't have heavy join paths.
psql $DATABASE_URL -c "ALTER TABLE clients ENABLE ROW LEVEL SECURITY;"
psql $DATABASE_URL -c "ALTER TABLE projects ENABLE ROW LEVEL SECURITY;"
```

Watch error logs for 24 hours. Any "no rows returned" complaints from users
on a query that should return data = `setTenantContext()` was missed
somewhere. Roll back via `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` and
fix the call site.

### Stage 4 - enable RLS on remaining tables

```bash
psql $DATABASE_URL < scripts/rls/02-enable-tables.sql
```

Enables RLS on the rest. Watch for the same symptoms.

### Stage 5 - enforce against superuser too

```sql
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
-- repeat for each table
```

By default `FORCE ROW LEVEL SECURITY` is off, meaning the table owner
(usually the role your app connects as) bypasses RLS. Stage 5 makes the
policies binding even for the owner role - the strongest protection. Only
do this once you've run for several weeks at Stage 4 with no escapes.

## Rollback

Each stage is independently reversible:

```sql
-- Disable RLS on a single table
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Drop a policy
DROP POLICY IF EXISTS clients_tenant_isolation ON clients;
```

## Why not Drizzle migrations?

Drizzle's migration model assumes "schema state X → schema state Y" with
auto-generated SQL. RLS policies and `ENABLE ROW LEVEL SECURITY` are
operational toggles, not schema state. Mixing them with Drizzle migrations
risks either auto-rollback during a `db:push` or accidental re-enablement
after a rollback. Standalone scripts make the staging explicit.
