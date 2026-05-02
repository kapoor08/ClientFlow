import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { runSingleProbe } from "@/server/status/run-probes";
import { logger } from "@/server/observability/logger";

/**
 * Trigger an immediate probe for one component. Platform-admin only.
 *
 * Used from the admin UI's "probe now" button - lets an operator force a
 * fresh check while debugging without waiting for the next cron tick.
 * Synchronous; returns the probe result + newly-derived component state.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { state, result } = await runSingleProbe(id);
    return NextResponse.json({ state, result });
  } catch (err) {
    logger.error("status.probe_now.failed", err, { componentId: id });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Probe failed" },
      { status: 500 },
    );
  }
}
