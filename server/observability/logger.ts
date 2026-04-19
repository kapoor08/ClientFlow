/**
 * Thin structured logger. The whole point is to have a single place to wire
 * Sentry / Datadog / Logtail in later without touching callers.
 *
 * Usage:
 *   import { logger } from "@/server/observability/logger";
 *   logger.info("user.signed_in", { userId });
 *   logger.warn("webhook.retry", { eventId, attempt: 3 });
 *   logger.error("webhook.failed", err, { eventId });
 *
 * The first argument is an "event key" — a dotted, snake_case identifier that
 * describes what happened. Context is a flat object of primitive values.
 *
 * In production, swap the `emit()` implementation to forward to Sentry via
 * `Sentry.captureMessage` / `Sentry.captureException`. Callers don't change.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function sanitize(ctx: LogContext | undefined): Record<string, unknown> {
  if (!ctx) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (v === undefined) continue;
    // Drop anything that isn't JSON-safe — the caller passed it but we don't
    // want giant objects or circular refs ending up in production logs.
    if (
      v === null ||
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
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

function emit(level: LogLevel, event: string, payload: Record<string, unknown>) {
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  // Single emission point. Replace this body with Sentry/Datadog/Logtail later.
  if (level === "error") {
    console.error(JSON.stringify(line));
  } else if (level === "warn") {
    console.warn(JSON.stringify(line));
  } else {
    console.log(JSON.stringify(line));
  }
}

export const logger = {
  debug(event: string, context?: LogContext) {
    if (process.env.NODE_ENV === "production") return;
    emit("debug", event, sanitize(context));
  },

  info(event: string, context?: LogContext) {
    emit("info", event, sanitize(context));
  },

  warn(event: string, context?: LogContext) {
    emit("warn", event, sanitize(context));
  },

  /**
   * Log an error with optional cause. Pass the underlying Error as the second
   * argument — its message and stack are captured automatically; the
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
    emit("error", event, { ...sanitize(context), ...errPayload });
  },
};

export type Logger = typeof logger;
