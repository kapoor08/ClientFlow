import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";

/**
 * Liveness + readiness probe.
 *
 * Uptime monitors (Vercel, Better Stack, UptimeRobot) and load-balancer health
 * checks should hit this endpoint. Returns 200 only when the DB round-trips
 * successfully; 503 otherwise so monitors correctly flag a dead instance.
 *
 * Intentionally unauthenticated and intentionally cheap - one `SELECT 1`.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();

  let dbStatus: "ok" | "fail" = "ok";
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbStatus = "fail";
  }

  const body = {
    status: dbStatus === "ok" ? "ok" : "degraded",
    ts: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    region: process.env.VERCEL_REGION ?? "local",
    db: dbStatus,
    latencyMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: dbStatus === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
