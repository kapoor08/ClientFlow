import Stripe from "stripe";
import { logger } from "@/server/observability/logger";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-02-25.clover",
});

export const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY;

// Legacy mapping kept for backward-compat; new code should resolve price IDs
// from the plans table directly (plan.stripeMonthlyPriceId).
export const STRIPE_PRICE_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER,
  professional: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
};

// ─── Plan sync helpers ────────────────────────────────────────────────────────
// All helpers are best-effort: if Stripe isn't configured or a call fails, we
// log and return undefined instead of throwing so admin flows don't break.

export type StripePlanInput = {
  name: string;
  description?: string | null;
  currencyCode?: string | null;
  monthlyPriceCents?: number | null;
  yearlyPriceCents?: number | null;
  code: string;
};

type ProductResult = {
  productId: string;
  monthlyPriceId: string | null;
  yearlyPriceId: string | null;
};

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
  if (!isStripeConfigured) return undefined;
  try {
    return await fn();
  } catch (err) {
    logger.error(`stripe.${label}.failed`, err);
    return undefined;
  }
}

export async function createStripeProductAndPrices(
  input: StripePlanInput,
): Promise<ProductResult | undefined> {
  return safe("createProduct", async () => {
    const product = await stripe.products.create({
      name: input.name,
      description: input.description ?? undefined,
      metadata: { planCode: input.code },
    });

    const currency = (input.currencyCode ?? "usd").toLowerCase();

    let monthlyPriceId: string | null = null;
    if (input.monthlyPriceCents != null && input.monthlyPriceCents > 0) {
      const p = await stripe.prices.create({
        product: product.id,
        unit_amount: input.monthlyPriceCents,
        currency,
        recurring: { interval: "month" },
        metadata: { planCode: input.code, interval: "month" },
      });
      monthlyPriceId = p.id;
    }

    let yearlyPriceId: string | null = null;
    if (input.yearlyPriceCents != null && input.yearlyPriceCents > 0) {
      const p = await stripe.prices.create({
        product: product.id,
        unit_amount: input.yearlyPriceCents,
        currency,
        recurring: { interval: "year" },
        metadata: { planCode: input.code, interval: "year" },
      });
      yearlyPriceId = p.id;
    }

    return { productId: product.id, monthlyPriceId, yearlyPriceId };
  });
}

export async function updateStripeProductMeta(
  productId: string,
  input: Pick<StripePlanInput, "name" | "description">,
): Promise<void> {
  await safe("updateProduct", async () => {
    await stripe.products.update(productId, {
      name: input.name,
      description: input.description ?? undefined,
    });
  });
}

/**
 * Creates a new Stripe Price and archives the old one. Stripe Prices are
 * immutable — changing the amount requires creating a new Price. Existing
 * subscriptions on the old Price continue unaffected.
 */
export async function rotateStripePrice(params: {
  productId: string;
  oldPriceId: string | null;
  amountCents: number;
  currencyCode: string;
  interval: "month" | "year";
  planCode: string;
}): Promise<string | undefined> {
  return safe("rotatePrice", async () => {
    const newPrice = await stripe.prices.create({
      product: params.productId,
      unit_amount: params.amountCents,
      currency: params.currencyCode.toLowerCase(),
      recurring: { interval: params.interval },
      metadata: { planCode: params.planCode, interval: params.interval },
    });

    if (params.oldPriceId) {
      await stripe.prices.update(params.oldPriceId, { active: false }).catch((err) => {
        logger.error("stripe.archiveOldPrice.failed", err, { priceId: params.oldPriceId });
      });
    }

    return newPrice.id;
  });
}

export async function archiveStripePrice(priceId: string): Promise<void> {
  await safe("archivePrice", async () => {
    await stripe.prices.update(priceId, { active: false });
  });
}

export async function setStripeProductActive(
  productId: string,
  active: boolean,
): Promise<void> {
  await safe("setProductActive", async () => {
    await stripe.products.update(productId, { active });
  });
}
