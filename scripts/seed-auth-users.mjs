import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";

const connectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Set NEON_DATABASE_URL or DATABASE_URL before running the seed script.",
  );
}

const sql = neon(connectionString);

const seedConfig = {
  organizationName: process.env.SEED_ORGANIZATION_NAME || "ClientFlow Seed Org",
  organizationSlug:
    process.env.SEED_ORGANIZATION_SLUG || "clientflow-seed-org",
  admin: {
    name: process.env.SEED_ADMIN_NAME || "ClientFlow Admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@clientflow.local",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@123456",
    roleKey: "admin",
  },
  user: {
    name: process.env.SEED_USER_NAME || "ClientFlow User",
    email: process.env.SEED_USER_EMAIL || "user@clientflow.local",
    password: process.env.SEED_USER_PASSWORD || "User@123456",
    roleKey: "member",
  },
};

const roleDefinitions = [
  { key: "owner", name: "Owner" },
  { key: "admin", name: "Admin" },
  { key: "manager", name: "Manager" },
  { key: "member", name: "Member" },
  { key: "client", name: "Client" },
];

function createId() {
  return crypto.randomUUID();
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 48);
}

async function ensureRole({ key, name }) {
  const roleId = createId();
  const rows = await sql`
    insert into roles (id, scope, key, name, is_system, created_at)
    values (${roleId}, 'organization', ${key}, ${name}, true, now())
    on conflict (scope, key)
    do update set
      name = excluded.name
    returning id, key, name
  `;

  return rows[0];
}

async function ensureOrganization() {
  const organizationId = createId();
  const slug = slugify(seedConfig.organizationSlug || seedConfig.organizationName);
  const rows = await sql`
    insert into organizations (
      id,
      name,
      slug,
      timezone,
      currency_code,
      is_active,
      created_at,
      updated_at
    )
    values (
      ${organizationId},
      ${seedConfig.organizationName},
      ${slug},
      'UTC',
      'USD',
      true,
      now(),
      now()
    )
    on conflict (slug)
    do update set
      name = excluded.name,
      updated_at = now()
    returning id, name, slug
  `;

  return rows[0];
}

async function ensureOrganizationSettings(organizationId) {
  const settingId = createId();
  await sql`
    insert into organization_settings (
      id,
      organization_id,
      require_email_verification,
      created_at,
      updated_at
    )
    values (${settingId}, ${organizationId}, false, now(), now())
    on conflict (organization_id)
    do update set
      updated_at = now()
  `;
}

async function ensureUserAccount({ name, email, password }) {
  const userId = createId();
  const passwordHash = await hashPassword(password);

  const userRows = await sql`
    insert into "user" (
      id,
      name,
      email,
      email_verified,
      image,
      created_at,
      updated_at
    )
    values (
      ${userId},
      ${name},
      ${email.toLowerCase()},
      true,
      null,
      now(),
      now()
    )
    on conflict (email)
    do update set
      name = excluded.name,
      email_verified = excluded.email_verified,
      updated_at = now()
    returning id, name, email
  `;

  const savedUser = userRows[0];

  const existingCredentialAccount = await sql`
    select id
    from account
    where user_id = ${savedUser.id}
      and provider_id = 'credential'
    limit 1
  `;

  if (existingCredentialAccount[0]) {
    await sql`
      update account
      set
        password = ${passwordHash},
        updated_at = now()
      where id = ${existingCredentialAccount[0].id}
    `;
  } else {
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
        ${savedUser.id},
        'credential',
        ${savedUser.id},
        ${passwordHash},
        now(),
        now()
      )
    `;
  }

  return savedUser;
}

async function ensureMembership({ organizationId, userId, roleId }) {
  const membershipId = createId();
  await sql`
    insert into organization_memberships (
      id,
      organization_id,
      user_id,
      role_id,
      status,
      joined_at,
      created_at,
      updated_at
    )
    values (
      ${membershipId},
      ${organizationId},
      ${userId},
      ${roleId},
      'active',
      now(),
      now(),
      now()
    )
    on conflict (organization_id, user_id)
    do update set
      role_id = excluded.role_id,
      status = excluded.status,
      joined_at = coalesce(organization_memberships.joined_at, excluded.joined_at),
      updated_at = now()
  `;
}

async function main() {
  const rolesByKey = new Map();

  for (const roleDefinition of roleDefinitions) {
    const role = await ensureRole(roleDefinition);
    rolesByKey.set(role.key, role);
  }

  const organization = await ensureOrganization();
  await ensureOrganizationSettings(organization.id);

  const adminUser = await ensureUserAccount(seedConfig.admin);
  const normalUser = await ensureUserAccount(seedConfig.user);
  const adminRole = rolesByKey.get(seedConfig.admin.roleKey);
  const userRole = rolesByKey.get(seedConfig.user.roleKey);

  if (!adminRole || !userRole) {
    throw new Error("Required seed roles were not initialized correctly.");
  }

  await ensureMembership({
    organizationId: organization.id,
    userId: adminUser.id,
    roleId: adminRole.id,
  });

  await ensureMembership({
    organizationId: organization.id,
    userId: normalUser.id,
    roleId: userRole.id,
  });

  console.log("Seed completed successfully.");
  console.table([
    {
      type: "organization",
      name: organization.name,
      email: "-",
      role: "-",
      password: "-",
    },
    {
      type: "admin",
      name: adminUser.name,
      email: adminUser.email,
      role: seedConfig.admin.roleKey,
      password: seedConfig.admin.password,
    },
    {
      type: "user",
      name: normalUser.name,
      email: normalUser.email,
      role: seedConfig.user.roleKey,
      password: seedConfig.user.password,
    },
  ]);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
