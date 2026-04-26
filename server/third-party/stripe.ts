import Stripe from "stripe";
import { logger } from "@/server/observability/logger";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-02-25.clover",
  // Stripe SDK defaults to 80s, way too high for a user-facing request. 10s
  // covers the slowest legitimate Stripe responses while letting us surface
  // an error before Vercel's 30s function ceiling.
  timeout: 10_000,
  // Built-in exponential backoff for transient network errors (5xx, 429,
  // connection drops). Only safe-method requests retry by default; mutations
  // retry only when the caller passes an Idempotency-Key.
  maxNetworkRetries: 2,
});

export const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY;

// ─── Circuit breaker ──────────────────────────────────────────────────────────
// In-process breaker that short-circuits Stripe calls when the upstream API
// has been consistently failing. Each Vercel instance keeps its own state -
// global coordination isn't needed because the goal is to stop one instance
// from exhausting its function-time budget on a degraded Stripe.
//
// State machine:
//   closed     - normal traffic, count failures
//   open       - reject calls immediately for `cooldownMs`
//   half_open  - allow trial calls; N successes → closed, any failure → open
//
// 4xx errors (validation / auth / not-found) do NOT count toward tripping -
// those are caller bugs, not a Stripe-availability signal.

type BreakerState = "closed" | "open" | "half_open";

class StripeCircuitBreaker {
  private state: BreakerState = "closed";
  private failures = 0;
  private halfOpenSuccesses = 0;
  private nextAttemptAt = 0;

  constructor(
    private readonly threshold = 5,
    private readonly cooldownMs = 30_000,
    private readonly halfOpenSuccessTarget = 2,
  ) {}

  canExecute(): boolean {
    if (this.state === "closed") return true;
    if (this.state === "open") {
      if (Date.now() >= this.nextAttemptAt) {
        this.state = "half_open";
        this.halfOpenSuccesses = 0;
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess() {
    if (this.state === "half_open") {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.halfOpenSuccessTarget) {
        this.state = "closed";
        this.failures = 0;
        this.halfOpenSuccesses = 0;
        logger.info("stripe.circuit.closed");
      }
      return;
    }
    if (this.state === "closed") this.failures = 0;
  }

  recordFailure(err: unknown) {
    if (!isAvailabilityError(err)) {
      // 4xx etc - not a Stripe-health signal, treat as success for breaker.
      this.recordSuccess();
      return;
    }
    if (this.state === "half_open") {
      this.trip();
      return;
    }
    this.failures++;
    if (this.failures >= this.threshold) this.trip();
  }

  private trip() {
    this.state = "open";
    this.nextAttemptAt = Date.now() + this.cooldownMs;
    logger.warn("stripe.circuit.open", {
      until: new Date(this.nextAttemptAt).toISOString(),
      failures: this.failures,
    });
  }

  /** Test-only hook. */
  reset() {
    this.state = "closed";
    this.failures = 0;
    this.halfOpenSuccesses = 0;
    this.nextAttemptAt = 0;
  }

  getState(): BreakerState {
    return this.state;
  }
}

function isAvailabilityError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { type?: string; statusCode?: number; code?: string };
  if (e.type === "StripeAPIError" || e.type === "StripeConnectionError") return true;
  if (typeof e.statusCode === "number" && e.statusCode >= 500) return true;
  if (e.code === "ETIMEDOUT" || e.code === "ECONNRESET" || e.code === "ECONNABORTED") {
    return true;
  }
  return false;
}

export class StripeCircuitOpenError extends Error {
  constructor(public readonly label: string) {
    super(`Stripe circuit breaker is open (${label})`);
    this.name = "StripeCircuitOpenError";
  }
}

export const stripeCircuitBreaker = new StripeCircuitBreaker();

/**
 * Wrap a Stripe call with the circuit breaker. Re-throws the underlying error
 * so callers can map it to their own response. If the breaker is open, throws
 * `StripeCircuitOpenError` immediately without contacting Stripe.
 */
export async function withStripeBreaker<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!stripeCircuitBreaker.canExecute()) {
    logger.warn("stripe.circuit.short_circuit", { label });
    throw new StripeCircuitOpenError(label);
  }
  try {
    const result = await fn();
    stripeCircuitBreaker.recordSuccess();
    return result;
  } catch (err) {
    stripeCircuitBreaker.recordFailure(err);
    throw err;
  }
}

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
  if (!stripeCircuitBreaker.canExecute()) {
    logger.warn("stripe.circuit.short_circuit", { label });
    return undefined;
  }
  try {
    const result = await fn();
    stripeCircuitBreaker.recordSuccess();
    return result;
  } catch (err) {
    stripeCircuitBreaker.recordFailure(err);
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
 * immutable - changing the amount requires creating a new Price. Existing
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

export async function setStripeProductActive(productId: string, active: boolean): Promise<void> {
  await safe("setProductActive", async () => {
    await stripe.products.update(productId, { active });
  });
}
