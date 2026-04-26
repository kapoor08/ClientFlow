# Database migrations

Drizzle-Kit is the source of truth for schema changes. Every migration goes
through `npm run db:generate -- --name <semantic_name>` and is committed
together with the schema change that produced it.

## Naming convention

**Always pass `--name`.** Drizzle's auto-generated names (e.g.
`0011_parallel_terror.sql`) tell future readers and on-call engineers
nothing. The newer migrations in this folder use semantic names
(`0008_add_role_permissions_config.sql`,
`0010_add_onboarding_completed_at.sql`) - all new ones should follow that
pattern. There is no automated guard - this is a code-review rule.

Format: `<verb>_<subject>` in snake_case, present tense, no leading article.

| Good                             | Bad               |
| -------------------------------- | ----------------- |
| `add_invoice_tax_breakdown`      | `update_invoices` |
| `drop_unused_rate_limit_buckets` | `cleanup`         |
| `index_subscriptions_by_org`     | `add_index`       |
| `backfill_user_deletion_columns` | `fix_users`       |

Common verbs: `add`, `drop`, `rename`, `index`, `backfill`, `migrate`,
`relax`, `tighten`.

## Procedure

1. Edit the schema in `db/schemas/*.ts`.
2. Run `npm run db:generate -- --name <semantic_name>`. Drizzle writes the
   `.sql` file and updates `meta/_journal.json`.
3. Read the generated SQL. If it does anything destructive (drops a column,
   alters a NOT NULL constraint, changes a default), add a comment block at
   the top of the file explaining the why and any backfill plan.
4. Commit the schema change AND the migration in the same commit.
5. Apply with `npm run db:migrate` (CI / production) or `npm run db:push`
   (local dev iteration only - `push` skips migration files and is unsafe
   to use against shared databases).

## Reviewing migrations in PRs

A reviewer should be able to read just the migration file's name and the
SQL inside and understand what changed and why. If the name doesn't tell
them, push back on it.

## Historical migrations

The earlier `<adjective>_<noun>` files (`0011_parallel_terror.sql`,
`0014_powerful_hercules.sql`, etc.) predate this convention. They are NOT
renamed in place - the file names are part of the applied-migrations
history that production tracks via `meta/_journal.json`. Renaming them
would re-apply against any database that has already run them. Leave them
alone; the rule applies forward only.
