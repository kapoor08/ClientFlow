import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import Stripe from "stripe";

const connectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Set NEON_DATABASE_URL or DATABASE_URL before running.");
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Set STRIPE_SECRET_KEY before running.");
}

const sql = neon(connectionString);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

/**
 * Backfills Stripe product + price IDs onto existing plans rows that were
 * inserted before DB-driven Stripe sync was wired up.
 *
 * For each plan where stripe_product_id IS NULL:
 *   - Creates a Stripe Product (name from plan.name, metadata.planCode)
 *   - Creates monthly + yearly Prices if the plan has those amounts (> 0)
 *   - Writes the new IDs back to the plans row
 *
 * Plans with $0 pricing (Free Trial) or no price (Enterprise) will get a
 * Product but no Price — those plans aren't purchasable via Stripe checkout
 * and that's fine.
 */
async function backfill() {
  const rows = await sql`
    select id, code, name, description, currency_code, monthly_price_cents, yearly_price_cents
    from plans
    where stripe_product_id is null
    order by display_order, code
  `;

  if (rows.length === 0) {
    console.log("No plans need backfilling — every plan already has a Stripe product ID.");
    return;
  }

  console.log(`Found ${rows.length} plan(s) to backfill:\n`);

  for (const plan of rows) {
    console.log(`→ ${plan.code} (${plan.name})`);
    const currency = (plan.currency_code ?? "USD").toLowerCase();

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description ?? undefined,
      metadata: { planCode: plan.code },
    });
    console.log(`    Product: ${product.id}`);

    let monthlyPriceId = null;
    if (plan.monthly_price_cents != null && plan.monthly_price_cents > 0) {
      const p = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthly_price_cents,
        currency,
        recurring: { interval: "month" },
        metadata: { planCode: plan.code, interval: "month" },
      });
      monthlyPriceId = p.id;
      console.log(`    Monthly price: ${monthlyPriceId}`);
    }

    let yearlyPriceId = null;
    if (plan.yearly_price_cents != null && plan.yearly_price_cents > 0) {
      const p = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearly_price_cents,
        currency,
        recurring: { interval: "year" },
        metadata: { planCode: plan.code, interval: "year" },
      });
      yearlyPriceId = p.id;
      console.log(`    Yearly price: ${yearlyPriceId}`);
    }

    await sql`
      update plans
      set stripe_product_id = ${product.id},
          stripe_monthly_price_id = ${monthlyPriceId},
          stripe_yearly_price_id = ${yearlyPriceId},
          updated_at = now()
      where id = ${plan.id}
    `;
    console.log(`    ✓ Written to DB\n`);
  }

  console.log("Done.");
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
