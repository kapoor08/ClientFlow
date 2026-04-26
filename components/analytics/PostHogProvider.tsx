"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { CONSENT_UPDATED_EVENT, hasConsent, type ConsentChoice } from "@/lib/consent";

/**
 * Mounts PostHog analytics, gated on the user's analytics-cookie consent.
 *
 * - On mount AND on every consent-update event, decides whether to init/opt-in
 *   or opt-out of capture. PostHog itself stores the opt-out in localStorage,
 *   but we re-evaluate from the cf_consent cookie so the two sources of truth
 *   stay aligned.
 *
 * - On every route change, fires an explicit `$pageview`. Next.js App Router
 *   does not trigger PostHog's auto-pageview because it uses soft client
 *   navigation that PostHog can't observe by default.
 *
 * Renders nothing.
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let initialized = false;

function initIfNeeded() {
  if (initialized || typeof window === "undefined" || !KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false, // we fire $pageview manually
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    autocapture: true,
    disable_session_recording: true, // opt-in only - keep noise + cost down
  });
  initialized = true;
}

function applyConsent(choice: ConsentChoice | null) {
  if (!KEY || typeof window === "undefined") return;
  const allowed = choice ? choice.analytics : false;
  if (allowed) {
    initIfNeeded();
    posthog.opt_in_capturing();
  } else if (initialized) {
    posthog.opt_out_capturing();
  }
}

export function PostHogProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Apply current consent on mount + listen for changes.
  useEffect(() => {
    applyConsent(hasConsent("analytics") ? readSnapshot() : null);
    function onUpdate(e: Event) {
      const detail = (e as CustomEvent<ConsentChoice>).detail ?? null;
      applyConsent(detail);
    }
    window.addEventListener(CONSENT_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, onUpdate);
  }, []);

  // Fire pageview on route change (only if we've been opted in).
  useEffect(() => {
    if (!initialized || !KEY) return;
    if (!hasConsent("analytics")) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

// Read a synthetic ConsentChoice from the cookie just for the initial mount -
// the consent module's reader returns null when no choice is set, but we want
// to call applyConsent(null) in that case to ensure we're opted out.
function readSnapshot(): ConsentChoice | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("cf_consent="))
    ?.split("=")[1];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentChoice>;
    return {
      v: 1,
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      ts: Number(parsed.ts) || Date.now(),
    };
  } catch {
    return null;
  }
}
