// P3-10: apply all migrations to a real Postgres in CI.
//
// `drizzle-kit migrate` cannot be used here: it auto-selects the installed
// `@neondatabase/serverless` driver, which only connects to remote Neon/Vercel
// Postgres over a WebSocket and therefore cannot reach the plain `postgres:16`
// service container in CI. This script drives the SAME migrations through
// node-postgres (`pg`) over plain TCP using drizzle-orm's own migrator, so a
// fresh database gets every migration applied from scratch each run.
//
// Production migrations still run from `vercel-build` against the prod DB.
import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL (or NEON_DATABASE_URL) must be set for ci-migrate.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

try {
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
