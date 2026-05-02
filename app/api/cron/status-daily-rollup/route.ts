import { assertCronAuth, runCron } from "@/server/cron/guard";
import { runDailyRollup } from "@/server/status/run-rollup";

/**
 * Daily rollup cron - target cadence: once per day, ideally ~02:00 UTC so
 * yesterday's last probes have settled.
 *
 * Iterates all active status components, rolls up the previous 90 days of
 * raw probe results into per-day aggregates (uptime %, avg latency, worst
 * state with maintenance overlay), bulk-upserts the rollup table, then
 * prunes raw probe rows older than 90 days.
 *
 * Idempotent + self-healing: every run re-rolls every day in the window
 * via ON CONFLICT DO UPDATE, so a missed run is fully recovered on the
 * next firing.
 */
export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  return runCron("status-daily-rollup", async () => {
    const result = await runDailyRollup();
    return result as unknown as Record<string, unknown>;
  });
}
