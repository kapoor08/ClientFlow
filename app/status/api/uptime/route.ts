import { NextResponse, type NextRequest } from "next/server";
import { getUptimeBarsByComponent } from "@/server/status/uptime-bars";
import { listActiveComponents } from "@/server/status/queries";

/**
 * `/api/uptime?componentId=<id>&endDate=<YYYY-MM-DD>`
 *
 * Backs the calendar's prev/next-window navigation on the history page.
 * Returns 90 days of uptime bars for one component, anchored to the given
 * UTC `endDate` (defaults to today). The component must be in the
 * currently-active list - we validate that here so a malformed param can't
 * be used to enumerate inactive components.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const componentId = req.nextUrl.searchParams.get("componentId");
  if (!componentId) {
    return NextResponse.json({ error: "componentId is required" }, { status: 400 });
  }

  const components = await listActiveComponents();
  const component = components.find((c) => c.id === componentId);
  if (!component) {
    return NextResponse.json({ error: "component not found" }, { status: 404 });
  }

  // Parse endDate. Accepts either `YYYY-MM-DD` or a full ISO timestamp -
  // both get normalized to a UTC day-start. Anything unparseable is
  // ignored and the query falls back to "today".
  let endDate: Date | undefined;
  const rawEnd = req.nextUrl.searchParams.get("endDate");
  if (rawEnd) {
    const datePart = rawEnd.slice(0, 10); // YYYY-MM-DD prefix from either format
    const parsed = new Date(`${datePart}T00:00:00.000Z`);
    if (!isNaN(parsed.getTime())) endDate = parsed;
  }

  const map = await getUptimeBarsByComponent([componentId], endDate);
  const bars = map.get(componentId) ?? [];

  return NextResponse.json({
    bars: bars.map((b) => ({
      dateIso: b.date.toISOString(),
      state: b.state,
      uptimeBp: b.uptimeBp,
      totalChecks: b.totalChecks,
    })),
  });
}
