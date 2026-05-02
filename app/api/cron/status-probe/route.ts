import { assertCronAuth, runCron } from "@/server/cron/guard";
import { runAllProbes } from "@/server/status/run-probes";

/**
 * Status probe cron - target cadence: every 1 minute.
 *
 * Iterates active status components, runs each one's probe (HTTP / Stripe /
 * signal-freshness), records the result, and recomputes the cached
 * `currentState` on the component row.
 *
 * Idempotent and tolerant of skipped runs - the public page and state
 * derivation work off the most-recent N probe results, so a missed minute
 * just delays state convergence.
 */
export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  return runCron("status-probe", async () => {
    const result = await runAllProbes();
    return result as unknown as Record<string, unknown>;
  });
}
