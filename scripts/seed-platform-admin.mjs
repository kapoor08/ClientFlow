/**
 * Seed script: create or promote a platform admin user.
 *
 * Usage:
 *   node scripts/seed-platform-admin.mjs
 *
 * Environment overrides (all optional):
 *   PLATFORM_ADMIN_NAME     Display name          (default: "Platform Admin")
 *   PLATFORM_ADMIN_EMAIL    Email address         (default: "platformadmin@clientflow.local")
 *   PLATFORM_ADMIN_PASSWORD Password              (default: "Admin@123456")
 *
 * If a user with the given email already exists, the script just sets
 * is_platform_admin = true on that row - no duplicate is created.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";

const connectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Set NEON_DATABASE_URL or DATABASE_URL before running this script.",
  );
}

const sql = neon(connectionString);

const config = {
  name: process.env.PLATFORM_ADMIN_NAME || "Platform Admin",
  email: (process.env.PLATFORM_ADMIN_EMAIL || "platformadmin@clientflow.local").toLowerCase(),
  password: process.env.PLATFORM_ADMIN_PASSWORD || "Admin@123456",
};

function createId() {
  return crypto.randomUUID();
}

async function main() {
  console.log(`\nSetting up platform admin: ${config.email}\n`);

  // Check if user already exists
  const existing = await sql`
    select id, name, email, is_platform_admin
    from "user"
    where email = ${config.email}
    limit 1
  `;

  let userId;

  if (existing[0]) {
    userId = existing[0].id;
    console.log(`User already exists (id: ${userId}). Promoting to platform admin…`);

    await sql`
      update "user"
      set
        is_platform_admin = true,
        updated_at = now()
      where id = ${userId}
    `;
  } else {
    userId = createId();
    const passwordHash = await hashPassword(config.password);

    console.log("Creating new platform admin user…");

    await sql`
      insert into "user" (
        id,
        name,
        email,
        email_verified,
        is_platform_admin,
        image,
        created_at,
        updated_at
      )
      values (
        ${userId},
        ${config.name},
        ${config.email},
        true,
        true,
        null,
        now(),
        now()
      )
    `;

    await sql`
      insert into account (
        id,
        account_id,
        provider_id,
        user_id,
        password,
        created_at,
        updated_at
      )
      values (
        ${createId()},
        ${userId},
        'credential',
        ${userId},
        ${passwordHash},
        now(),
        now()
      )
    `;

    console.log("Credential account created.");
  }

  // Verify the final state
  const result = await sql`
    select id, name, email, email_verified, is_platform_admin
    from "user"
    where id = ${userId}
    limit 1
  `;

  console.log("\nPlatform admin ready:\n");
  console.table([
    {
      name: result[0].name,
      email: result[0].email,
      password: existing[0] ? "(existing - unchanged)" : config.password,
      is_platform_admin: result[0].is_platform_admin,
      email_verified: result[0].email_verified,
    },
  ]);

  console.log("Navigate to /admin after signing in.\n");
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
