import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes, randomUUID } from "node:crypto";

/**
 * Generate a monitoring API key in the application's standard format
 * (`cf_<64-hex>`) and insert a row into `api_keys` so the key actually
 * authenticates against `requireV1Auth`.
 *
 * The raw key is printed ONCE - copy it into your Vercel env as
 * `STATUS_MONITORING_API_KEY`. Only the SHA-256 hash + prefix are stored
 * in the DB, matching how `/admin/api-keys` creates keys.
 *
 * Usage:
 *   node scripts/generate-status-monitoring-key.mjs --org-slug <slug>
 *   node scripts/generate-status-monitoring-key.mjs --org-id <uuid>
 *
 * If you haven't created a dedicated monitoring org yet, run the script
 * with no args to list existing orgs and pick one (or create it first
 * via /admin/organizations).
 *
 * Requires NEON_DATABASE_URL or DATABASE_URL.
 */

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set NEON_DATABASE_URL or DATABASE_URL before running this script.");
  process.exit(1);
}
const sql = neon(connectionString);

// ── Args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name) {
  const ix = args.indexOf(name);
  return ix !== -1 ? args[ix + 1] : null;
}
const orgSlug = flag("--org-slug");
const orgId = flag("--org-id");
const keyName = flag("--name") ?? "Status monitoring";

// ── Resolve org ───────────────────────────────────────────────────────────
let resolvedOrg;
if (orgId) {
  const rows = await sql`SELECT id, name, slug FROM organizations WHERE id = ${orgId} LIMIT 1`;
  resolvedOrg = rows[0];
} else if (orgSlug) {
  const rows = await sql`SELECT id, name, slug FROM organizations WHERE slug = ${orgSlug} LIMIT 1`;
  resolvedOrg = rows[0];
}

if (!resolvedOrg) {
  console.error("Organization not found.\n");
  const orgs = await sql`SELECT id, name, slug FROM organizations ORDER BY name LIMIT 50`;
  if (orgs.length === 0) {
    console.error("No organizations exist yet. Create one via /admin/organizations first.");
  } else {
    console.error("Pick one:\n");
    for (const o of orgs) {
      console.error(`  --org-slug ${o.slug.padEnd(30)} (${o.name})`);
    }
    console.error("\nThen rerun:");
    console.error("  node scripts/generate-status-monitoring-key.mjs --org-slug <slug>");
  }
  process.exit(1);
}

// ── Generate key in the same format as server/api-keys.ts ─────────────────
const raw = `cf_${randomBytes(32).toString("hex")}`;
const prefix = raw.slice(0, 12);
const hash = createHash("sha256").update(raw).digest("hex");

await sql`
  INSERT INTO api_keys (id, organization_id, name, key_hash, key_prefix, created_by_user_id)
  VALUES (
    ${randomUUID()},
    ${resolvedOrg.id},
    ${keyName},
    ${hash},
    ${prefix},
    NULL
  )
`;

console.log("\n--- API key created ---\n");
console.log(`Organization : ${resolvedOrg.name} (${resolvedOrg.slug})`);
console.log(`Name         : ${keyName}`);
console.log(`Prefix       : ${prefix}`);
console.log(`\nRaw key (copy now - it will not be shown again):\n`);
console.log(`  ${raw}\n`);
console.log("Set this in your Vercel production env as:");
console.log(`  STATUS_MONITORING_API_KEY=${raw}\n`);
