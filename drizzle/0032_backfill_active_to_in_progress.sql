-- Data backfill: normalize legacy project status 'active' → 'in_progress'.
--
-- This was previously an ORPHANED, un-journaled file
-- (0016_migrate_active_to_in_progress.sql) that `drizzle-kit migrate` never
-- applied on fresh/other environments, causing silent status drift (queries
-- assume 'in_progress'). Re-added here as a properly journaled migration so it
-- runs everywhere. Idempotent: after it runs there are no 'active' rows, so a
-- re-run (or running on an env where it already happened) is a no-op.
UPDATE "projects" SET "status" = 'in_progress' WHERE "status" = 'active';
