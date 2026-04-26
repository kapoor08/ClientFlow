import "server-only";

import { logger } from "@/server/observability/logger";

/**
 * Server-side PostHog event capture for funnel/business events that fire from
 * webhooks and server actions where there is no browser to do it client-side.
 *
 * No new SDK dependency: PostHog's public ingest endpoint accepts a single
 * JSON POST. Calls are best-effort and never block the parent request - the
 * fetch is bounded by a 2s AbortSignal and any failure is logged and
 * swallowed.
 *
 * Distinct ID convention for server events:
 *   - Org-level events use `org:<orgId>` so per-tenant funnels are visible
 *     without leaking individual user identity.
 */

const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

type CaptureOpts = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

export async function captureServerEvent(opts: CaptureOpts): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  try {
    await fetch(`${HOST}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event: opts.event,
        distinct_id: opts.distinctId,
        properties: {
          $lib: "clientflow-server",
          ...(opts.properties ?? {}),
        },
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(2_000),
      // Server-to-server fetch - no caching needed.
      cache: "no-store",
    });
  } catch (err) {
    logger.warn("posthog.server_capture_failed", {
      event: opts.event,
      distinctId: opts.distinctId,
      reason: err instanceof Error ? err.message : String(err),
    });
  }
}

export function orgDistinctId(organizationId: string): string {
  return `org:${organizationId}`;
}
