import {
  listActiveComponents,
  listActiveIncidents,
  listIncidentsByDay,
  deriveBannerState,
  latestStateUpdate,
  type PublicComponent,
  type PublicIncidentSummary,
} from "@/server/status/queries";
import { getUptimeBarsByComponent, type UptimeBarDay } from "@/server/status/uptime-bars";
import { StatusBanner } from "@/components/status/StatusBanner";
import { ComponentList } from "@/components/status/ComponentList";
import { IncidentsSection } from "@/components/status/IncidentsSection";
import { PastIncidentsByDay } from "@/components/status/PastIncidents";

/**
 * Public status page. Reads from the prober's cached `currentState` plus the
 * incidents tables - one indexed SELECT per section, no recomputation. ISR
 * with revalidate=60 means each unique URL is rendered at most once per
 * minute (admin posts also call `revalidatePath('/status')` for instant
 * cache busts). Presentational sub-components live in components/status/.
 */
export const revalidate = 60;

export default async function StatusPage() {
  // The DB is not reachable during `next build` in some environments (e.g. CI).
  // Fall back to empty state so prerendering succeeds; ISR regenerates with real
  // data once the database is reachable.
  let components: PublicComponent[] = [];
  let activeIncidents: PublicIncidentSummary[] = [];
  let pastIncidentsByDay: Array<{ date: Date; incidents: PublicIncidentSummary[] }> = [];
  try {
    [components, activeIncidents, pastIncidentsByDay] = await Promise.all([
      listActiveComponents(),
      listActiveIncidents(),
      listIncidentsByDay(14),
    ]);
  } catch {
    // keep empty fallbacks
  }
  const banner = deriveBannerState(components);
  const lastUpdate = latestStateUpdate(components);
  const barsByComponent =
    components.length > 0
      ? await getUptimeBarsByComponent(components.map((c) => c.id))
      : new Map<string, UptimeBarDay[]>();

  return (
    <div className="space-y-10">
      <StatusBanner state={banner} lastUpdate={lastUpdate} />
      {activeIncidents.length > 0 && (
        <IncidentsSection title="Active incidents" incidents={activeIncidents} />
      )}
      <ComponentList components={components} barsByComponent={barsByComponent} />
      <PastIncidentsByDay days={pastIncidentsByDay} />
    </div>
  );
}
