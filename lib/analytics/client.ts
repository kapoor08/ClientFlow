"use client";

import posthog from "posthog-js";
import { hasConsent } from "@/lib/consent";

/**
 * Client-side wrapper around posthog.capture that respects the user's
 * analytics-cookie consent. PostHog is only initialised by `PostHogProvider`
 * once consent is granted, so this is a defence-in-depth check - if the
 * provider hasn't run yet (e.g. consent toggled on mid-session and the
 * effect hasn't re-fired), the call is a no-op rather than a crash.
 */
export function captureClientEvent(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if (!hasConsent("analytics")) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // Capture failures must never break user-facing flows.
  }
}

/**
 * Bind a stable PostHog identity to the current user. Call once after a
 * successful sign-in / sign-up so subsequent events tie back to a person.
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if (!hasConsent("analytics")) return;
  try {
    posthog.identify(userId, properties);
  } catch {
    /* swallow */
  }
}
