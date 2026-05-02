import "server-only";

import { eq } from "drizzle-orm";
import { stripe } from "@/server/third-party/stripe";
import { db } from "@/server/db/client";
import { statusServiceSignals } from "@/db/schema";
import type { ProbeConfig } from "@/db/schemas/status";

export type ProbeResult = {
  success: boolean;
  latencyMs: number;
  httpStatus?: number;
  error?: string;
};

const PROBE_TIMEOUT_MS = 5_000;

/**
 * Run a single component's probe. Never throws - the orchestrator wants to
 * record every result, including the failure-to-probe case.
 *
 * `http`           hit a URL, expect a specific status code
 * `stripe_balance` cheap outbound Stripe call - tests the Stripe path
 * `signal`         freshness check on a heartbeat key bumped from inside
 *                  the live app (e.g. "email_send_success")
 */
export async function runProbe(config: ProbeConfig): Promise<ProbeResult> {
  switch (config.kind) {
    case "http":
      return runHttpProbe(config);
    case "stripe_balance":
      return runStripeProbe();
    case "signal":
      return runSignalProbe(config);
  }
}

/**
 * URL templates may use `{APP_URL}` to resolve to `NEXT_PUBLIC_APP_URL` at
 * probe time. Lets the same component config work in dev (localhost) and
 * prod (the real domain) without a per-environment seed.
 */
function expandUrl(template: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return template.replace("{APP_URL}", appUrl);
}

async function runHttpProbe(config: Extract<ProbeConfig, { kind: "http" }>): Promise<ProbeResult> {
  const startedAt = Date.now();
  const url = expandUrl(config.url);
  const headers: Record<string, string> = {};

  if (config.authHeader && config.authValueEnv) {
    const value = process.env[config.authValueEnv];
    if (!value) {
      return {
        success: false,
        latencyMs: 0,
        error: `Auth env "${config.authValueEnv}" is unset`,
      };
    }
    headers[config.authHeader] = value;
  }

  try {
    const res = await fetch(url, {
      method: config.method,
      headers,
      body: config.body,
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      cache: "no-store",
    });
    const latencyMs = Date.now() - startedAt;
    const success = res.status === config.expectedStatus;
    return {
      success,
      latencyMs,
      httpStatus: res.status,
      error: success ? undefined : `Expected status ${config.expectedStatus}, got ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runStripeProbe(): Promise<ProbeResult> {
  const startedAt = Date.now();
  if (!process.env.STRIPE_SECRET_KEY) {
    return { success: false, latencyMs: 0, error: "STRIPE_SECRET_KEY is unset" };
  }
  try {
    await stripe.balance.retrieve();
    return { success: true, latencyMs: Date.now() - startedAt };
  } catch (err) {
    return {
      success: false,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runSignalProbe(
  config: Extract<ProbeConfig, { kind: "signal" }>,
): Promise<ProbeResult> {
  const startedAt = Date.now();
  const [row] = await db
    .select({ lastObservedAt: statusServiceSignals.lastObservedAt })
    .from(statusServiceSignals)
    .where(eq(statusServiceSignals.signalKey, config.signalKey))
    .limit(1);

  const latencyMs = Date.now() - startedAt;

  if (!row) {
    return {
      success: false,
      latencyMs,
      error: `Signal "${config.signalKey}" has never been observed`,
    };
  }

  const ageMs = Date.now() - row.lastObservedAt.getTime();
  const ageMinutes = Math.floor(ageMs / 60_000);
  const fresh = ageMinutes < config.staleAfterMin;

  return {
    success: fresh,
    latencyMs,
    error: fresh
      ? undefined
      : `Signal stale (${ageMinutes}m old, threshold ${config.staleAfterMin}m)`,
  };
}
