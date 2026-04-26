/**
 * Thin structured logger. Forwards errors and warnings to Sentry, and keeps
 * a local JSON-line console copy for Vercel log inspection.
 *
 * Usage:
 *   import { logger } from "@/server/observability/logger";
 *   logger.info("user.signed_in", { userId });
 *   logger.warn("webhook.retry", { eventId, attempt: 3 });
 *   logger.error("webhook.failed", err, { eventId });
 */

import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

/**
 * Pull the per-request correlation ID set by middleware.ts.
 * Returns null when called outside of a request scope (cron jobs, module load,
 * background tasks) - `headers()` throws in those contexts and we silently
 * fall back to no ID rather than crashing the log call.
 */
async function readRequestId(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-request-id");
  } catch {
    return null;
  }
}

function sanitize(ctx: LogContext | undefined): Record<string, unknown> {
  if (!ctx) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (v === undefined) continue;
    // Drop anything that isn't JSON-safe - the caller passed it but we don't
    // want giant objects or circular refs ending up in production logs.
    if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else if (v instanceof Date) {
      out[k] = v.toISOString();
    } else {
      try {
        out[k] = JSON.parse(JSON.stringify(v));
      } catch {
        out[k] = String(v);
      }
    }
  }
  return out;
}

async function emit(level: LogLevel, event: string, payload: Record<string, unknown>) {
  const requestId = await readRequestId();
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(requestId ? { requestId } : {}),
    ...payload,
  };

  // 1. Local JSON-line console (still visible in Vercel logs).
  if (level === "error") console.error(JSON.stringify(line));
  else if (level === "warn") console.warn(JSON.stringify(line));
  else console.log(JSON.stringify(line));

  // 2. Forward to Sentry.
  //    - error → captureException (if we have the underlying Error) or
  //      captureMessage fallback. Attaches `event` as a tag and the full
  //      context as `extra` so it's searchable in the Sentry UI.
  //    - warn  → captureMessage at warning level.
  //    - info  → breadcrumb (shows up in the trail before an error, not as
  //      its own issue).
  //    - debug → nothing; stays in console only.
  const tags: Record<string, string> = { event };
  if (requestId) tags.requestId = requestId;

  if (level === "error") {
    const err = payload.errorMessage
      ? Object.assign(new Error(String(payload.errorMessage)), {
          name: String(payload.errorName ?? "Error"),
          stack: payload.errorStack ? String(payload.errorStack) : undefined,
        })
      : null;

    if (err) {
      Sentry.captureException(err, { tags, extra: line });
    } else {
      Sentry.captureMessage(event, { level: "error", tags, extra: line });
    }
  } else if (level === "warn") {
    Sentry.captureMessage(event, { level: "warning", tags, extra: line });
  } else if (level === "info") {
    Sentry.addBreadcrumb({ category: event, level: "info", data: line });
  }
}

export const logger = {
  debug(event: string, context?: LogContext) {
    if (process.env.NODE_ENV === "production") return;
    void emit("debug", event, sanitize(context));
  },

  info(event: string, context?: LogContext) {
    void emit("info", event, sanitize(context));
  },

  warn(event: string, context?: LogContext) {
    void emit("warn", event, sanitize(context));
  },

  /**
   * Log an error with optional cause. Pass the underlying Error as the second
   * argument - its message and stack are captured automatically; the
   * `context` param is for extra metadata (entity IDs, user IDs, etc.).
   */
  error(event: string, err: unknown, context?: LogContext) {
    const errPayload: Record<string, unknown> = {};
    if (err instanceof Error) {
      errPayload.errorMessage = err.message;
      errPayload.errorName = err.name;
      if (err.stack) errPayload.errorStack = err.stack;
    } else if (err != null) {
      errPayload.error = String(err);
    }
    void emit("error", event, { ...sanitize(context), ...errPayload });
  },
};

export type Logger = typeof logger;
