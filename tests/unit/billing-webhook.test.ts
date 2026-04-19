import { describe, it, expect } from "vitest";
import type Stripe from "stripe";
import {
  getSubscriptionPeriod,
  getSubscriptionIdFromInvoice,
  resolveSubscriptionChangeType,
  isHandledEventType,
  HANDLED_EVENT_TYPES,
} from "@/server/billing/webhook-helpers";

// ─── getSubscriptionPeriod ────────────────────────────────────────────────────
// Stripe moved current_period_* from the top-level Subscription to each
// SubscriptionItem in API 2024-09-30+. This helper must read both so the
// webhook works regardless of which Stripe API version is configured.

describe("getSubscriptionPeriod", () => {
  it("reads from subscription-item (Stripe 2024-09-30+ layout)", () => {
    const sub = {
      items: {
        data: [
          {
            current_period_start: 1700000000,
            current_period_end: 1702592000,
          },
        ],
      },
      trial_end: null,
    } as unknown as Stripe.Subscription;

    expect(getSubscriptionPeriod(sub)).toEqual({
      periodStart: 1700000000,
      periodEnd: 1702592000,
      trialEnd: null,
    });
  });

  it("falls back to top-level fields (legacy Stripe API)", () => {
    const sub = {
      items: { data: [{}] },
      current_period_start: 1600000000,
      current_period_end: 1602592000,
      trial_end: null,
    } as unknown as Stripe.Subscription;

    expect(getSubscriptionPeriod(sub)).toEqual({
      periodStart: 1600000000,
      periodEnd: 1602592000,
      trialEnd: null,
    });
  });

  it("prefers item-level fields when both exist", () => {
    const sub = {
      items: {
        data: [
          {
            current_period_start: 1700000000,
            current_period_end: 1702592000,
          },
        ],
      },
      current_period_start: 1000000000,
      current_period_end: 1002592000,
      trial_end: null,
    } as unknown as Stripe.Subscription;

    const result = getSubscriptionPeriod(sub);
    expect(result.periodStart).toBe(1700000000);
    expect(result.periodEnd).toBe(1702592000);
  });

  it("returns undefined when neither source has values", () => {
    const sub = {
      items: { data: [{}] },
      trial_end: null,
    } as unknown as Stripe.Subscription;

    expect(getSubscriptionPeriod(sub)).toEqual({
      periodStart: undefined,
      periodEnd: undefined,
      trialEnd: null,
    });
  });

  it("passes through trial_end", () => {
    const sub = {
      items: { data: [{}] },
      trial_end: 1800000000,
    } as unknown as Stripe.Subscription;

    expect(getSubscriptionPeriod(sub).trialEnd).toBe(1800000000);
  });
});

// ─── getSubscriptionIdFromInvoice ─────────────────────────────────────────────
// Same cross-version concern for invoices: Stripe 2026+ nests the subscription
// ID under `parent.subscription_item.subscription`, older versions put it at
// `invoice.subscription`.

describe("getSubscriptionIdFromInvoice", () => {
  it("reads from parent.subscription_item.subscription (Stripe 2026+)", () => {
    const invoice = {
      parent: {
        subscription_item: { subscription: "sub_new_123" },
      },
    } as unknown as Stripe.Invoice;

    expect(getSubscriptionIdFromInvoice(invoice)).toBe("sub_new_123");
  });

  it("falls back to invoice.subscription (legacy)", () => {
    const invoice = {
      subscription: "sub_legacy_456",
    } as unknown as Stripe.Invoice;

    expect(getSubscriptionIdFromInvoice(invoice)).toBe("sub_legacy_456");
  });

  it("prefers the new location when both are set", () => {
    const invoice = {
      parent: { subscription_item: { subscription: "sub_new_123" } },
      subscription: "sub_legacy_456",
    } as unknown as Stripe.Invoice;

    expect(getSubscriptionIdFromInvoice(invoice)).toBe("sub_new_123");
  });

  it("returns null when neither location has a string value", () => {
    const invoice = { parent: {} } as unknown as Stripe.Invoice;
    expect(getSubscriptionIdFromInvoice(invoice)).toBeNull();
  });

  it("ignores non-string subscription values (e.g. expanded objects)", () => {
    const invoice = {
      subscription: { id: "sub_expanded" },
    } as unknown as Stripe.Invoice;
    expect(getSubscriptionIdFromInvoice(invoice)).toBeNull();
  });
});

// ─── resolveSubscriptionChangeType ────────────────────────────────────────────
// Drives which email template gets sent when a subscription changes.

describe("resolveSubscriptionChangeType", () => {
  it("returns 'cancelled' when cancel_at_period_end flips false → true", () => {
    expect(
      resolveSubscriptionChangeType(
        { cancelAtPeriodEnd: false },
        { cancel_at_period_end: true },
      ),
    ).toBe("cancelled");
  });

  it("returns 'resumed' when cancel_at_period_end flips true → false", () => {
    expect(
      resolveSubscriptionChangeType(
        { cancelAtPeriodEnd: true },
        { cancel_at_period_end: false },
      ),
    ).toBe("resumed");
  });

  it("returns 'upgraded' when cancel_at_period_end is unchanged (both false)", () => {
    expect(
      resolveSubscriptionChangeType(
        { cancelAtPeriodEnd: false },
        { cancel_at_period_end: false },
      ),
    ).toBe("upgraded");
  });

  it("returns 'upgraded' when cancel_at_period_end is unchanged (both true)", () => {
    expect(
      resolveSubscriptionChangeType(
        { cancelAtPeriodEnd: true },
        { cancel_at_period_end: true },
      ),
    ).toBe("upgraded");
  });
});

// ─── HANDLED_EVENT_TYPES / isHandledEventType ─────────────────────────────────
// Guards the list of Stripe events the webhook processes. Adding a new event
// requires updating the switch statement in route.ts; this test catches drift.

describe("HANDLED_EVENT_TYPES", () => {
  it("contains the 6 Stripe events the webhook processes", () => {
    expect([...HANDLED_EVENT_TYPES].sort()).toEqual(
      [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.paid",
        "invoice.payment_failed",
      ].sort(),
    );
  });

  it("includes customer.subscription.created (critical — covers subs made outside checkout)", () => {
    expect(HANDLED_EVENT_TYPES).toContain("customer.subscription.created");
  });

  it("isHandledEventType returns true for handled events", () => {
    expect(isHandledEventType("invoice.paid")).toBe(true);
    expect(isHandledEventType("customer.subscription.created")).toBe(true);
  });

  it("isHandledEventType returns false for unrelated Stripe events", () => {
    expect(isHandledEventType("customer.created")).toBe(false);
    expect(isHandledEventType("charge.succeeded")).toBe(false);
    expect(isHandledEventType("invoice.overdue")).toBe(false);
  });
});
