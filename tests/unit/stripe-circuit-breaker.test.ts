import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  stripeCircuitBreaker,
  withStripeBreaker,
  StripeCircuitOpenError,
} from "@/server/third-party/stripe";

/**
 * Verifies the in-process circuit breaker that protects user-facing handlers
 * from a degraded Stripe API. Defaults: threshold=5 failures, cooldown=30s,
 * half-open success target=2.
 */

function availabilityError() {
  return Object.assign(new Error("simulated upstream failure"), {
    type: "StripeAPIError",
    statusCode: 503,
  });
}

function clientError() {
  return Object.assign(new Error("simulated 4xx"), {
    type: "StripeInvalidRequestError",
    statusCode: 400,
  });
}

describe("stripeCircuitBreaker", () => {
  beforeEach(() => {
    stripeCircuitBreaker.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts closed and runs the wrapped fn", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withStripeBreaker("test.ok", fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledOnce();
    expect(stripeCircuitBreaker.getState()).toBe("closed");
  });

  it("trips to open after 5 availability failures", async () => {
    const err = availabilityError();
    for (let i = 0; i < 5; i++) {
      await expect(withStripeBreaker("test.fail", () => Promise.reject(err))).rejects.toBe(err);
    }
    expect(stripeCircuitBreaker.getState()).toBe("open");
  });

  it("short-circuits subsequent calls with StripeCircuitOpenError when open", async () => {
    const err = availabilityError();
    for (let i = 0; i < 5; i++) {
      await expect(withStripeBreaker("test.fail", () => Promise.reject(err))).rejects.toBe(err);
    }

    const fn = vi.fn().mockResolvedValue("never-runs");
    await expect(withStripeBreaker("test.short", fn)).rejects.toBeInstanceOf(
      StripeCircuitOpenError,
    );
    expect(fn).not.toHaveBeenCalled();
  });

  it("does NOT count 4xx errors toward the failure threshold", async () => {
    const err = clientError();
    for (let i = 0; i < 10; i++) {
      await expect(withStripeBreaker("test.4xx", () => Promise.reject(err))).rejects.toBe(err);
    }
    expect(stripeCircuitBreaker.getState()).toBe("closed");
  });

  it("transitions open → half_open after cooldown, closes on success target", async () => {
    vi.useFakeTimers();
    const err = availabilityError();
    for (let i = 0; i < 5; i++) {
      await expect(withStripeBreaker("test.trip", () => Promise.reject(err))).rejects.toBe(err);
    }
    expect(stripeCircuitBreaker.getState()).toBe("open");

    // Advance past 30s cooldown
    vi.setSystemTime(Date.now() + 31_000);

    // First call after cooldown enters half_open and runs
    await expect(withStripeBreaker("test.half1", () => Promise.resolve("ok"))).resolves.toBe("ok");
    expect(stripeCircuitBreaker.getState()).toBe("half_open");

    // Second success closes the breaker
    await expect(withStripeBreaker("test.half2", () => Promise.resolve("ok"))).resolves.toBe("ok");
    expect(stripeCircuitBreaker.getState()).toBe("closed");
  });

  it("re-trips immediately when half_open trial fails", async () => {
    vi.useFakeTimers();
    const err = availabilityError();
    for (let i = 0; i < 5; i++) {
      await expect(withStripeBreaker("test.trip", () => Promise.reject(err))).rejects.toBe(err);
    }

    vi.setSystemTime(Date.now() + 31_000);

    await expect(withStripeBreaker("test.half_fail", () => Promise.reject(err))).rejects.toBe(err);
    expect(stripeCircuitBreaker.getState()).toBe("open");
  });
});
