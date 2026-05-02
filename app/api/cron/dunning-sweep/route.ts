import { assertCronAuth, runCron } from "@/server/cron/guard";
import { runDunningSweep } from "@/server/billing/dunning";

/**
 * Daily dunning sweep.
 *
 * Walks every overdue, unpaid invoice and sends the next reminder in the
 * day-1/3/7/14 cadence (see DUNNING_DAYS in server/billing/dunning.ts).
 * Idempotent: stage advances on each send, so a missed run is caught up on
 * the next one without duplicate emails.
 */
export async function POST(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  return runCron("dunning-sweep", async () => {
    const result = await runDunningSweep();
    return result as unknown as Record<string, unknown>;
  });
}
