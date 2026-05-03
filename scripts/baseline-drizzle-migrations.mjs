import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * One-time baseline for `drizzle.__drizzle_migrations`.
 *
 * If a database was originally set up via `drizzle-kit push` (or any other
 * path that creates tables without updating the migrations-tracking
 * table), the first `drizzle-kit migrate` run replays migration 0000 from
 * scratch and fails on "relation already exists". This script stamps a
 * range of migrations as already applied so subsequent `migrate` calls
 * skip them and only run genuinely-new migrations.
 *
 * Usage:
 *   # Mark migrations 0..25 (idx) as applied; leave 26+ to run normally
 *   node scripts/baseline-drizzle-migrations.mjs --upto-idx 25
 *
 *   # Dry-run (prints what it would do, no writes)
 *   node scripts/baseline-drizzle-migrations.mjs --upto-idx 25 --dry
 *
 * Hash format: SHA-256 of the migration .sql file contents (matches what
 * drizzle-orm/postgres-js's migrator computes at runtime).
 *
 * Idempotent: skips entries whose hash already exists in the table.
 */

const args = process.argv.slice(2);
function flag(name) {
  const ix = args.indexOf(name);
  return ix !== -1 ? args[ix + 1] : null;
}
const dryRun = args.includes("--dry");
const probeOnly = args.includes("--probe");
const uptoIdxRaw = flag("--upto-idx");
const uptoIdx = uptoIdxRaw == null ? null : Number(uptoIdxRaw);

if (!probeOnly && (uptoIdx == null || !Number.isInteger(uptoIdx) || uptoIdx < 0)) {
  console.error(
    "Usage:\n" +
      "  node scripts/baseline-drizzle-migrations.mjs --probe\n" +
      "  node scripts/baseline-drizzle-migrations.mjs --upto-idx <N> [--dry]\n",
  );
  process.exit(1);
}

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set NEON_DATABASE_URL or DATABASE_URL before running this script.");
  process.exit(1);
}
const sql = neon(connectionString);

// ── Probe-only mode: report DB state and recommended --upto-idx ──────────
if (probeOnly) {
  console.log(`\nProbing: ${connectionString.replace(/:[^:@]+@/, ":***@")}\n`);

  const [tablesRow] = await sql`
    SELECT
      EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_name = 'api_keys') AS has_api_keys,
      EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_name = 'notification_deliveries') AS has_notification_deliveries,
      EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_name = 'status_components') AS has_status_components
  `;

  const trackingExists = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
    ) AS exists
  `;
  const trackingCount = trackingExists[0].exists
    ? Number((await sql`SELECT count(*)::int AS c FROM drizzle.__drizzle_migrations`)[0].c)
    : 0;

  console.log("DB state:");
  console.log(`  api_keys table                       : ${tablesRow.has_api_keys ? "yes" : "no"}`);
  console.log(`  notification_deliveries table        : ${tablesRow.has_notification_deliveries ? "yes" : "no"}`);
  console.log(`  status_components table              : ${tablesRow.has_status_components ? "yes" : "no"}`);
  console.log(`  __drizzle_migrations rows            : ${trackingCount}`);

  // Decide recommendation:
  //   - 0026 dropped notification_deliveries → if table absent, 0026 applied
  //   - 0027 created status_components       → if table present,  0027 applied
  const m26Applied = !tablesRow.has_notification_deliveries;
  const m27Applied = tablesRow.has_status_components;

  let recommended;
  if (m26Applied && m27Applied) recommended = 27;
  else if (m26Applied && !m27Applied) recommended = 26;
  else if (!m26Applied && m27Applied) {
    // Strange: 0027 effect but 0026 not. Probably push'd schema in non-migration order.
    recommended = 27;
  } else {
    recommended = 25;
  }

  console.log("\nMigration-effect detection:");
  console.log(`  0026 (drop notification_deliveries) : ${m26Applied ? "applied" : "NOT applied"}`);
  console.log(`  0027 (create status_*)              : ${m27Applied ? "applied" : "NOT applied"}`);

  console.log(`\nRecommended:`);
  console.log(`  npm run db:baseline-migrations -- --upto-idx ${recommended} --dry`);
  console.log(`  (then drop --dry once it looks right)\n`);
  process.exit(0);
}

const journalPath = join(process.cwd(), "drizzle", "meta", "_journal.json");
const journal = JSON.parse(readFileSync(journalPath, "utf8"));

const targets = journal.entries.filter((e) => e.idx <= uptoIdx);
console.log(
  `\nBaselining ${targets.length} migrations (idx 0..${uptoIdx}) into drizzle.__drizzle_migrations`,
);
console.log(`Connection: ${connectionString.replace(/:[^:@]+@/, ":***@")}`);
console.log(dryRun ? "Mode: DRY RUN (no writes)\n" : "Mode: LIVE\n");

// Ensure the schema + table exist (drizzle's own migrator creates them on
// first run; if the user has never run migrate this script's INSERTs would
// otherwise fail with "relation does not exist").
if (!dryRun) {
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;
}

// Pre-fetch existing hashes for idempotency.
let existingHashes = new Set();
if (!dryRun) {
  const rows = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
  existingHashes = new Set(rows.map((r) => r.hash));
}

let inserted = 0;
let skipped = 0;
for (const entry of targets) {
  const sqlPath = join(process.cwd(), "drizzle", `${entry.tag}.sql`);
  const content = readFileSync(sqlPath, "utf8");
  const hash = createHash("sha256").update(content).digest("hex");

  if (!dryRun && existingHashes.has(hash)) {
    console.log(`  · ${entry.tag.padEnd(36)} already stamped, skipping`);
    skipped++;
    continue;
  }

  if (dryRun) {
    console.log(`  + ${entry.tag.padEnd(36)} hash=${hash.slice(0, 12)}...  (would insert)`);
    continue;
  }

  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash}, ${entry.when})
  `;
  console.log(`  + ${entry.tag.padEnd(36)} hash=${hash.slice(0, 12)}...  inserted`);
  inserted++;
}

console.log(
  `\nDone. ${inserted} inserted, ${skipped} already-present skipped, ${dryRun ? targets.length : 0} would-insert (dry).`,
);
console.log("\nNext: redeploy on Vercel. `drizzle-kit migrate` will now skip 0..N");
console.log("and apply only the new migrations (0026, 0027).\n");
