import "server-only";

import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Cron job authentication.
 *
 * Every cron endpoint called by cron-job.org (or any external scheduler)
 * must include an `Authorization: Bearer <CRON_SECRET>` header. This guard
 * compares the provided secret against `process.env.CRON_SECRET` using a
 * constant-time compare so the server doesn't leak timing information
 * about which prefix of the secret was correct.
 *
 * Returns a `NextResponse` with status 401 when the secret is missing or
 * wrong — the route should return it immediately. Returns `null` on success.
 *
 * Usage:
 *   export async function POST(request: Request) {
 *     const denied = assertCronAuth(request);
 *     if (denied) return denied;
 *     // … do the work
 *   }
 */
export function assertCronAuth(request: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Fail closed: no secret configured means no cron can run.
    return NextResponse.json(
      { error: "Cron not configured on this deployment." },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provided = header.slice(prefix.length);
  // Constant-time compare requires equal-length buffers; pad to the longer
  // of the two and then XOR the length-mismatch into the result.
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!timingSafeEqual(expectedBuf, providedBuf)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
