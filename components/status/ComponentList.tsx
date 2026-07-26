import type { PublicComponent } from "@/server/status/queries";
import type { UptimeBarDay } from "@/server/status/uptime-bars";
import { UptimeBars, type UptimeBarDayClient } from "@/components/status/UptimeBars";
import { StatePill } from "./StatusBadges";

function UptimeBarForComponent({ bars }: { bars: UptimeBarDay[] }) {
  if (bars.length === 0) return null;

  const known = bars.filter((b) => b.totalChecks > 0 && b.uptimeBp != null);
  const avgUptimeBp =
    known.length > 0
      ? Math.round(known.reduce((sum, b) => sum + (b.uptimeBp ?? 0), 0) / known.length)
      : null;
  const avgLabel = avgUptimeBp != null ? `${(avgUptimeBp / 100).toFixed(2)}% uptime` : "No data";

  // Serialize Date → ISO string at the server boundary so the client component
  // can be a `"use client"` boundary without rehydration issues.
  const clientBars: UptimeBarDayClient[] = bars.map((b) => ({
    dateIso: b.date.toISOString(),
    state: b.state,
    uptimeBp: b.uptimeBp,
    totalChecks: b.totalChecks,
  }));

  return <UptimeBars bars={clientBars} averageUptimeLabel={avgLabel} />;
}

export function ComponentList({
  components,
  barsByComponent,
}: {
  components: PublicComponent[];
  barsByComponent: Map<string, UptimeBarDay[]>;
}) {
  if (components.length === 0) {
    return (
      <section>
        <h2 className="text-foreground text-lg font-semibold">Services</h2>
        <p className="border-border bg-card text-muted-foreground mt-4 rounded-xl border p-6 text-sm">
          No services configured yet.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-foreground text-lg font-semibold">Services</h2>
      <ul className="border-border bg-card divide-border mt-4 divide-y overflow-hidden rounded-xl border">
        {components.map((c) => (
          <li key={c.id} className="space-y-3 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-medium">{c.name}</p>
                {c.description ? (
                  <p className="text-muted-foreground mt-0.5 text-xs">{c.description}</p>
                ) : null}
              </div>
              <StatePill state={c.currentState} />
            </div>
            <UptimeBarForComponent bars={barsByComponent.get(c.id) ?? []} />
          </li>
        ))}
      </ul>
    </section>
  );
}
