import { sql } from "drizzle-orm";
import { buildMetadata } from "@/lib/seo";
import { db } from "@/server/db/client";
import StatusPage from ".";

export const metadata = buildMetadata({
  title: "Status",
  description:
    "Check the current status of ClientFlow's services. Stay informed about ongoing issues, maintenance schedules, and overall platform health.",
  path: "/status",
});

// Re-render the status board every minute. Fresh enough for visitors,
// cheap enough that we won't hammer upstreams on a viral incident.
export const revalidate = 60;

export type ProbeResult = {
  ok: boolean;
  latencyMs: number;
  // `skipped` means the upstream isn't configured in this environment, so we
  // intentionally surface it as a neutral "not monitored" pill rather than red.
  skipped?: boolean;
};

async function pingDatabase(): Promise<ProbeResult> {
  const startedAt = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch {
    return { ok: false, latencyMs: Date.now() - startedAt };
  }
}

// Cheap account-scoped read against Stripe. We hit /v1/balance directly via
// fetch instead of the SDK so health-check failures stay out of the app-side
// circuit breaker (a probe failure shouldn't trip live billing traffic).
async function pingStripe(): Promise<ProbeResult> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { ok: true, latencyMs: 0, skipped: true };
  const startedAt = Date.now();
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    return { ok: res.ok, latencyMs: Date.now() - startedAt };
  } catch {
    return { ok: false, latencyMs: Date.now() - startedAt };
  }
}

// Lists configured sender domains - cheapest authenticated read on Resend.
async function pingResend(): Promise<ProbeResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: true, latencyMs: 0, skipped: true };
  const startedAt = Date.now();
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    return { ok: res.ok, latencyMs: Date.now() - startedAt };
  } catch {
    return { ok: false, latencyMs: Date.now() - startedAt };
  }
}

export default async function Page() {
  const [dbHealth, stripeHealth, resendHealth] = await Promise.all([
    pingDatabase(),
    pingStripe(),
    pingResend(),
  ]);
  return <StatusPage dbHealth={dbHealth} stripeHealth={stripeHealth} resendHealth={resendHealth} />;
}
