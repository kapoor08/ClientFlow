import Link from "next/link";
import type { PublicIncidentSummary } from "@/server/status/queries";
import { IncidentStateBadge, ImpactBadge } from "./StatusBadges";
import { formatDayHeader, formatTimeRange, isSameUtcDay } from "./format";

function PastIncidentDay({ day }: { day: { date: Date; incidents: PublicIncidentSummary[] } }) {
  const isToday = isSameUtcDay(day.date, new Date());

  return (
    <div className="border-border border-b pb-5 last:border-b-0">
      <h3 className="text-foreground mb-3 text-sm font-medium">
        {formatDayHeader(day.date)}
        {isToday ? (
          <span className="text-muted-foreground ml-2 text-xs font-normal">(today)</span>
        ) : null}
      </h3>
      {day.incidents.length === 0 ? (
        <p className="text-muted-foreground text-xs italic">No incidents reported.</p>
      ) : (
        <ul className="space-y-3">
          {day.incidents.map((inc) => (
            <li key={inc.id}>
              <Link
                href={`/incidents/${inc.slug}`}
                className="hover:border-foreground/30 group block"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
                    {inc.title}
                  </h4>
                  <IncidentStateBadge state={inc.currentState} />
                  <ImpactBadge impact={inc.impact} />
                </div>
                {inc.affectedComponentNames.length > 0 && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Affecting: {inc.affectedComponentNames.join(", ")}
                  </p>
                )}
                {inc.latestUpdateBody && (
                  <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">
                    {inc.latestUpdateBody}
                  </p>
                )}
                <p className="text-muted-foreground mt-1.5 text-[11px]">
                  {formatTimeRange(inc.startedAt, inc.resolvedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PastIncidentsByDay({
  days,
}: {
  days: Array<{ date: Date; incidents: PublicIncidentSummary[] }>;
}) {
  return (
    <section>
      <h2 className="text-foreground text-lg font-semibold">Past Incidents</h2>
      <div className="mt-4 space-y-6">
        {days.map((day) => (
          <PastIncidentDay key={day.date.getTime()} day={day} />
        ))}
      </div>
    </section>
  );
}
