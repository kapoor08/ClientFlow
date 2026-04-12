import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Maps plan codes (from DB) to their Stripe monthly Price IDs (from env)
export const STRIPE_PRICE_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER,
  professional: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
};
