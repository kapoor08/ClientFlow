import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

/**
 * Seed the 7 default status components.
 *
 * Idempotent: existing rows (matched by slug) are updated with the latest
 * probe config + display order; new rows are inserted. Run repeatedly with
 * no harm; safe to re-run after probe-config changes.
 *
 *   node scripts/seed-status-components.mjs
 *
 * Requires NEON_DATABASE_URL or DATABASE_URL in env.
 */

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Set NEON_DATABASE_URL or DATABASE_URL before running this seed.");
}

const sql = neon(connectionString);

/**
 * Default components matching the plan agreed in step "What was built":
 *   web-app, database, auth, webhook-ingestion, public-api,
 *   email-delivery, payment-processing.
 *
 * URLs use the `{APP_URL}` template - the prober expands it from
 * NEXT_PUBLIC_APP_URL at runtime, so the same seed works in dev + prod.
 *
 * `auto_open_incident_after_min` is enabled on user-facing components
 * (web, db, auth, public API). The two indirect-signal components keep
 * it disabled by default since their staleness threshold already gives
 * a few minutes of grace.
 */
const components = [
  {
    slug: "web-app",
    name: "Web App",
    description: "Marketing site and authenticated app shell.",
    probeConfig: {
      kind: "http",
      url: "{APP_URL}/",
      method: "GET",
      expectedStatus: 200,
    },
    autoOpenIncidentAfterMin: 5,
    displayOrder: 0,
  },
  {
    slug: "database",
    name: "Database",
    description: "Primary application database (Neon Postgres).",
    probeConfig: {
      kind: "http",
      url: "{APP_URL}/api/health",
      method: "GET",
      expectedStatus: 200,
    },
    autoOpenIncidentAfterMin: 5,
    displayOrder: 1,
  },
  {
    slug: "auth",
    name: "Authentication",
    description: "Sign-in, sign-up, sessions.",
    probeConfig: {
      kind: "http",
      url: "{APP_URL}/api/auth/get-session",
      method: "GET",
      expectedStatus: 200,
    },
    autoOpenIncidentAfterMin: 5,
    displayOrder: 2,
  },
  {
    slug: "public-api",
    name: "Public API",
    description: "Customer-facing /api/v1 endpoints.",
    probeConfig: {
      kind: "http",
      url: "{APP_URL}/api/v1/clients",
      method: "GET",
      expectedStatus: 200,
      authHeader: "X-API-Key",
      authValueEnv: "STATUS_MONITORING_API_KEY",
    },
    autoOpenIncidentAfterMin: 5,
    displayOrder: 3,
  },
  {
    slug: "webhook-ingestion",
    name: "Webhook Ingestion",
    description: "Stripe billing webhook receiver.",
    probeConfig: {
      kind: "http",
      url: "{APP_URL}/api/billing/webhook",
      method: "POST",
      expectedStatus: 400, // missing signature → 400 confirms route alive
      body: "{}",
    },
    autoOpenIncidentAfterMin: 10,
    displayOrder: 4,
  },
  {
    slug: "email-delivery",
    name: "Email Delivery",
    description: "Transactional email sends via Resend.",
    probeConfig: {
      kind: "signal",
      signalKey: "email_send_success",
      staleAfterMin: 90,
    },
    autoOpenIncidentAfterMin: null,
    displayOrder: 5,
  },
  {
    slug: "payment-processing",
    name: "Payment Processing",
    description: "Stripe outbound API and webhook delivery from Stripe.",
    probeConfig: { kind: "stripe_balance" },
    autoOpenIncidentAfterMin: null,
    displayOrder: 6,
  },
];

async function upsert(component) {
  const existing = await sql`
    SELECT id FROM status_components WHERE slug = ${component.slug} LIMIT 1
  `;
  if (existing.length > 0) {
    await sql`
      UPDATE status_components SET
        name = ${component.name},
        description = ${component.description},
        probe_config = ${JSON.stringify(component.probeConfig)},
        auto_open_incident_after_min = ${component.autoOpenIncidentAfterMin},
        display_order = ${component.displayOrder},
        updated_at = NOW()
      WHERE slug = ${component.slug}
    `;
    return "updated";
  }
  await sql`
    INSERT INTO status_components (
      id, slug, name, description, probe_config,
      auto_open_incident_after_min, display_order, is_active, current_state
    ) VALUES (
      ${randomUUID()},
      ${component.slug},
      ${component.name},
      ${component.description},
      ${JSON.stringify(component.probeConfig)},
      ${component.autoOpenIncidentAfterMin},
      ${component.displayOrder},
      TRUE,
      'unknown'
    )
  `;
  return "inserted";
}

let inserted = 0;
let updated = 0;
for (const c of components) {
  const result = await upsert(c);
  if (result === "inserted") inserted++;
  else updated++;
  console.log(`  ${result === "inserted" ? "+" : "·"} ${c.slug}`);
}
console.log(`\nDone. ${inserted} inserted, ${updated} updated.`);
