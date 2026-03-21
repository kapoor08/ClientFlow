import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Set NEON_DATABASE_URL or DATABASE_URL before running the seed script.",
  );
}

const sql = neon(connectionString);

const roles = [
  { key: "owner",   name: "Owner" },
  { key: "admin",   name: "Admin" },
  { key: "manager", name: "Manager" },
  { key: "member",  name: "Member" },
  { key: "client",  name: "Client" },
];

async function seedRoles() {
  console.log("Seeding roles...");

  for (const role of roles) {
    const [row] = await sql`
      insert into roles (id, scope, key, name, is_system, created_at)
      values (${crypto.randomUUID()}, 'organization', ${role.key}, ${role.name}, true, now())
      on conflict (scope, key)
      do update set name = excluded.name
      returning id, key, name
    `;
    console.log(`  ✓ ${row.key} (${row.id})`);
  }

  console.log("Done.");
}

seedRoles().catch((err) => {
  console.error(err);
  process.exit(1);
});
