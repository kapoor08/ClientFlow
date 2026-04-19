import type Stripe from "stripe";

/**
 * In Stripe API 2024-09-30+, `current_period_start` and `current_period_end`
 * moved from the top-level Subscription object to each SubscriptionItem. This
 * helper reads from the item level first and falls back to the legacy
 * top-level field so the webhook works across API versions.
 */
export function getSubscriptionPeriod(stripeSub: Stripe.Subscription): {
  periodStart: number | undefined;
  periodEnd: number | undefined;
  trialEnd: number | null;
} {
  const item = stripeSub.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_start?: number; current_period_end?: number })
    | undefined;
  const sub = stripeSub as unknown as Record<string, unknown>;

  const periodStart =
    item?.current_period_start ??
    (typeof sub.current_period_start === "number" ? sub.current_period_start : undefined);
  const periodEnd =
    item?.current_period_end ??
    (typeof sub.current_period_end === "number" ? sub.current_period_end : undefined);
  const trialEnd = stripeSub.trial_end ?? null;

  return { periodStart, periodEnd, trialEnd };
}

/**
 * Stripe 2026+ exposes the subscription ID through
 * `invoice.parent.subscription_item.subscription`. Older API versions set it
 * directly on `invoice.subscription`. Read both so the webhook handler works
 * across API versions.
 */
export function getSubscriptionIdFromInvoice(stripeInvoice: Stripe.Invoice): string | null {
  const inv = stripeInvoice as unknown as Record<string, unknown>;
  const parent = inv.parent as Record<string, unknown> | undefined;
  const subItem = parent?.subscription_item as Record<string, unknown> | undefined;
  const fromParent = typeof subItem?.subscription === "string" ? subItem.subscription : null;
  const fromLegacy = typeof inv.subscription === "string" ? (inv.subscription as string) : null;
  return fromParent ?? fromLegacy;
}

/**
 * Derives a user-facing "change type" for subscription emails based on the
 * diff between the existing DB state and the incoming Stripe update. Used to
 * pick the right email template: cancellation notice, resume notice, or
 * generic "plan changed" notice.
 */
export function resolveSubscriptionChangeType(
  previous: { cancelAtPeriodEnd: boolean },
  next: { cancel_at_period_end: boolean },
): "cancelled" | "resumed" | "upgraded" {
  if (next.cancel_at_period_end && !previous.cancelAtPeriodEnd) return "cancelled";
  if (!next.cancel_at_period_end && previous.cancelAtPeriodEnd) return "resumed";
  return "upgraded";
}

/**
 * The set of Stripe events the webhook handler processes. Any event outside
 * this set is logged to `billing_webhook_events` but otherwise ignored.
 */
export const HANDLED_EVENT_TYPES = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
] as const;

export type HandledEventType = (typeof HANDLED_EVENT_TYPES)[number];

export function isHandledEventType(eventType: string): eventType is HandledEventType {
  return (HANDLED_EVENT_TYPES as readonly string[]).includes(eventType);
}
