import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { redis } from "@/server/rate-limit";

/**
 * Liveness + readiness probe.
 *
 * Uptime monitors (Vercel, Better Stack, UptimeRobot) and load-balancer health
 * checks should hit this endpoint. The DB is the readiness gate: 200 only when
 * `SELECT 1` round-trips, 503 otherwise so monitors flag a dead instance.
 *
 * Redis is probed too but is NOT a readiness gate: rate limiting fails open
 * (P1-7), so a Redis outage degrades security posture without taking the app
 * offline. Returning 503 on Redis-down would needlessly pull a serving instance
 * out of rotation. Instead we surface `redis: "fail"` + `status: "degraded"`
 * (still 200) so alerting can trigger on the body without killing the instance.
 *
 * Intentionally unauthenticated and intentionally cheap.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PROBE_TIMEOUT_MS = 2000;

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("probe timeout")), ms)),
  ]);
}

export async function GET() {
  const startedAt = Date.now();

  const [dbStatus, redisStatus] = await Promise.all([
    withTimeout(db.execute(sql`SELECT 1`), PROBE_TIMEOUT_MS)
      .then(() => "ok" as const)
      .catch(() => "fail" as const),
    withTimeout(redis.ping(), PROBE_TIMEOUT_MS)
      .then((pong) => (pong === "PONG" ? ("ok" as const) : ("fail" as const)))
      .catch(() => "fail" as const),
  ]);

  const ready = dbStatus === "ok";
  const status = !ready ? "fail" : redisStatus === "ok" ? "ok" : "degraded";

  const body = {
    status,
    ts: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    region: process.env.VERCEL_REGION ?? "local",
    db: dbStatus,
    redis: redisStatus,
    latencyMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: ready ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
