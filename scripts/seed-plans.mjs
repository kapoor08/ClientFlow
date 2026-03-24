import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Set NEON_DATABASE_URL or DATABASE_URL before running the seed script.");
}

const sql = neon(connectionString);

const plans = [
  {
    code: "free",
    name: "Free Trial",
    currencyCode: "USD",
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
  },
  {
    code: "starter",
    name: "Starter",
    currencyCode: "USD",
    monthlyPriceCents: 2900,
    yearlyPriceCents: 29000,
  },
  {
    code: "professional",
    name: "Professional",
    currencyCode: "USD",
    monthlyPriceCents: 7900,
    yearlyPriceCents: 79000,
  },
  {
    code: "enterprise",
    name: "Enterprise",
    currencyCode: "USD",
    monthlyPriceCents: null,
    yearlyPriceCents: null,
  },
];

// feature_key -> limit_value per plan (null = unlimited)
const featureLimits = {
  free:         { team_members: 2,   projects: 3,   clients: 5,   files_per_project: 5,   tasks_per_month: 20,  comments_per_month: 30,  file_uploads_per_month: 10  },
  starter:      { team_members: 5,   projects: 10,  clients: 15,  files_per_project: 15,  tasks_per_month: 100, comments_per_month: 200, file_uploads_per_month: 50  },
  professional: { team_members: null, projects: null, clients: null, files_per_project: null, tasks_per_month: null, comments_per_month: null, file_uploads_per_month: null },
  enterprise:   { team_members: null, projects: null, clients: null, files_per_project: null, tasks_per_month: null, comments_per_month: null, file_uploads_per_month: null },
};

async function seedPlans() {
  console.log("Seeding plans...");

  for (const plan of plans) {
    const [row] = await sql`
      insert into plans (id, code, name, currency_code, monthly_price_cents, yearly_price_cents, is_active, created_at, updated_at)
      values (
        ${crypto.randomUUID()},
        ${plan.code},
        ${plan.name},
        ${plan.currencyCode},
        ${plan.monthlyPriceCents},
        ${plan.yearlyPriceCents},
        true,
        now(),
        now()
      )
      on conflict (code) do update
        set name = excluded.name,
            monthly_price_cents = excluded.monthly_price_cents,
            yearly_price_cents = excluded.yearly_price_cents,
            updated_at = now()
      returning id, code
    `;

    console.log(`  ✓ Plan: ${row.code} (${row.id})`);

    const limits = featureLimits[plan.code];
    for (const [featureKey, limitValue] of Object.entries(limits)) {
      await sql`
        insert into plan_feature_limits (id, plan_id, feature_key, limit_value, created_at, updated_at)
        values (${crypto.randomUUID()}, ${row.id}, ${featureKey}, ${limitValue}, now(), now())
        on conflict (plan_id, feature_key) do update
          set limit_value = excluded.limit_value,
              updated_at = now()
      `;
      console.log(`    ✓ ${featureKey}: ${limitValue ?? "unlimited"}`);
    }
  }

  console.log("\nDone seeding plans.");
}

seedPlans().catch((err) => {
  console.error(err);
  process.exit(1);
});
