"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MinusCircle,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { ComponentState } from "@/db/schemas/status";
import type { UptimeBarDayClient } from "./UptimeBars";

/**
 * Calendar-grid uptime view, modelled on Atlassian Statuspage's Uptime tab.
 *
 * Shows the selected component's 90-day uptime as month grids. Users can
 * navigate to older windows with the prev/next arrows; older data is
 * fetched from `/api/uptime` on demand and cached client-side per
 * (componentId, endDate). The first render uses pre-fetched data passed
 * in by the server component to avoid a round-trip on initial load.
 */

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 90;

export type UptimeCalendarComponent = {
  id: string;
  name: string;
  description: string | null;
  averageUptimeLabel: string;
  /** Server-pre-fetched bars for the most recent window (today-anchored). */
  bars: UptimeBarDayClient[];
};

type Props = {
  components: UptimeCalendarComponent[];
};

type CacheKey = `${string}|${string}`; // `${componentId}|${endDateIso}`

export function UptimeCalendar({ components }: Props) {
  const [selectedId, setSelectedId] = useState(components[0]?.id ?? "");
  // `endDate` is the inclusive last day of the current 90-day window. Today
  // for the initial load; subtract 90 days each "prev" click.
  const [endDateIso, setEndDateIso] = useState<string>(() => todayUtcIso());
  const [cache, setCache] = useState<Map<CacheKey, UptimeBarDayClient[]>>(() => {
    // Seed the cache with the server-prefetched bars for each component's
    // most-recent window (the one anchored to today).
    const seeded = new Map<CacheKey, UptimeBarDayClient[]>();
    const today = todayUtcIso();
    for (const c of components) {
      seeded.set(`${c.id}|${today}`, c.bars);
    }
    return seeded;
  });
  const [isLoading, setIsLoading] = useState(false);

  const selected = components.find((c) => c.id === selectedId) ?? components[0];

  // Lazy-fetch when navigating to a window we haven't loaded yet.
  useEffect(() => {
    if (!selected) return;
    const key: CacheKey = `${selected.id}|${endDateIso}`;
    if (cache.has(key)) return;

    // The API accepts only YYYY-MM-DD - send just the date portion.
    // Sending the full ISO timestamp here was a silent bug: the API's
    // `${raw}T00:00:00.000Z` concatenation produced an invalid string,
    // fell back to today, and the calendar appeared frozen on the
    // most-recent window.
    const endDatePart = endDateIso.slice(0, 10);

    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/uptime?componentId=${encodeURIComponent(selected.id)}&endDate=${endDatePart}`)
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        const bars = (body?.bars ?? []) as UptimeBarDayClient[];
        setCache((prev) => {
          const next = new Map(prev);
          next.set(key, bars);
          return next;
        });
      })
      .catch(() => {
        if (cancelled) return;
        // Soft-fail: empty array renders as faint placeholders so the user
        // knows the window has no data rather than seeing nothing.
        setCache((prev) => {
          const next = new Map(prev);
          next.set(key, []);
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected, endDateIso, cache]);

  if (!selected) {
    return (
      <p className="text-muted-foreground border-border bg-card rounded-xl border p-6 text-sm">
        No services configured yet.
      </p>
    );
  }

  const cacheKey: CacheKey = `${selected.id}|${endDateIso}`;
  const bars = cache.get(cacheKey) ?? [];

  // Disable "next" when we're already at today.
  const isAtToday = endDateIso === todayUtcIso();
  const monthsInView = groupByMonth(bars);

  function shiftWindow(deltaDays: number) {
    const current = new Date(endDateIso);
    const next = new Date(current.getTime() + deltaDays * DAY_MS);
    const today = new Date(todayUtcIso());
    // Clamp at today - we never look into the future.
    const clampedMs = Math.min(next.getTime(), today.getTime());
    setEndDateIso(new Date(clampedMs).toISOString().slice(0, 10) + "T00:00:00.000Z");
  }

  return (
    <div className="space-y-6">
      {/* Component selector + range nav */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-[220px] flex-1">
          <Select value={selected.id} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {components.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => shiftWindow(-WINDOW_DAYS)}
            className="hover:border-primary hover:bg-primary/10 hover:text-primary h-8 w-8 cursor-pointer"
            aria-label="Previous window"
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="text-muted-foreground min-w-[10rem] text-center text-xs tabular-nums">
            {formatRangeLabel(bars, endDateIso)}
            {isLoading && <span className="ml-1 opacity-60">…</span>}
          </span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => shiftWindow(WINDOW_DAYS)}
            disabled={isAtToday}
            className="hover:border-primary hover:bg-primary/10 hover:text-primary h-8 w-8 cursor-pointer"
            aria-label="Next window"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      {selected.description && (
        <p className="text-muted-foreground -mt-2 text-xs">{selected.description}</p>
      )}

      {/* Month grids */}
      {bars.length === 0 ? (
        <p className="text-muted-foreground border-border bg-card rounded-xl border p-6 text-sm">
          No probe data for this window.
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {monthsInView.map((m) => (
            <MonthGrid key={`${m.year}-${m.month}`} month={m} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[11px]">
        <LegendDot color="bg-emerald-500" label="Operational" />
        <LegendDot color="bg-amber-500" label="Degraded" />
        <LegendDot color="bg-red-500" label="Outage" />
        <LegendDot color="bg-sky-500" label="Maintenance" />
        <LegendDot color="bg-muted" label="No data" />
      </div>
    </div>
  );
}

// ─── Month grid ────────────────────────────────────────────────────────────────

type Month = {
  year: number;
  month: number; // 0-indexed
  days: UptimeBarDayClient[];
};

function MonthGrid({ month }: { month: Month }) {
  const known = month.days.filter((d) => d.totalChecks > 0 && d.uptimeBp != null);
  const avgBp =
    known.length > 0
      ? Math.round(known.reduce((sum, d) => sum + (d.uptimeBp ?? 0), 0) / known.length)
      : null;

  const byDayOfMonth = useMemo(() => {
    const m = new Map<number, UptimeBarDayClient>();
    for (const d of month.days) {
      m.set(new Date(d.dateIso).getUTCDate(), d);
    }
    return m;
  }, [month.days]);

  const firstDay = new Date(Date.UTC(month.year, month.month, 1));
  const leadingBlanks = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-foreground text-sm font-semibold">
          {formatMonthLabel(month.year, month.month)}
        </h3>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {avgBp != null ? `${(avgBp / 100).toFixed(2)}%` : "—"}
        </span>
      </div>

      <div className="text-muted-foreground mb-1 grid grid-cols-7 gap-1 text-center text-[9px] font-medium tracking-wider uppercase">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <span key={`pad-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayOfMonth = i + 1;
          const bar = byDayOfMonth.get(dayOfMonth);
          if (!bar) {
            return (
              <span
                key={`out-${dayOfMonth}`}
                className="bg-muted/40 aspect-square rounded-sm"
                aria-hidden
              />
            );
          }
          return <DayCell key={bar.dateIso} bar={bar} />;
        })}
      </div>
    </div>
  );
}

// ─── Day cell ──────────────────────────────────────────────────────────────────

const CELL_COLOR: Record<ComponentState, string> = {
  operational: "bg-emerald-500 hover:bg-emerald-400",
  degraded: "bg-amber-500 hover:bg-amber-400",
  outage: "bg-red-500 hover:bg-red-400",
  maintenance: "bg-sky-500 hover:bg-sky-400",
  unknown: "bg-muted hover:bg-muted/70",
};

const STATE_LABEL: Record<ComponentState, string> = {
  operational: "Operational",
  degraded: "Degraded performance",
  outage: "Major outage",
  maintenance: "Scheduled maintenance",
  unknown: "No data",
};

const STATE_ICON: Record<ComponentState, typeof CheckCircle2> = {
  operational: CheckCircle2,
  degraded: AlertTriangle,
  outage: XCircle,
  maintenance: Wrench,
  unknown: MinusCircle,
};

const STATE_ICON_COLOR: Record<ComponentState, string> = {
  operational: "text-emerald-500",
  degraded: "text-amber-500",
  outage: "text-red-500",
  maintenance: "text-sky-500",
  unknown: "text-muted-foreground",
};

function DayCell({ bar }: { bar: UptimeBarDayClient }) {
  const date = new Date(bar.dateIso);
  const Icon = STATE_ICON[bar.state];
  return (
    <HoverCard openDelay={80} closeDelay={120}>
      <HoverCardTrigger asChild>
        <span
          className={`aspect-square cursor-default rounded-sm transition-colors ${CELL_COLOR[bar.state]}`}
          aria-label={`${formatLongDate(date)}: ${STATE_LABEL[bar.state]}`}
          tabIndex={0}
        />
      </HoverCardTrigger>
      <HoverCardContent side="top" align="center" sideOffset={8} className="w-60 p-3">
        <p className="text-foreground text-xs font-semibold">{formatLongDate(date)}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <Icon size={13} className={STATE_ICON_COLOR[bar.state]} aria-hidden />
          <span className="text-foreground text-xs">{STATE_LABEL[bar.state]}</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-y-1 text-[11px]">
          <dt className="text-muted-foreground">Uptime</dt>
          <dd className="text-foreground text-right tabular-nums">{formatUptime(bar.uptimeBp)}</dd>
          <dt className="text-muted-foreground">Probes</dt>
          <dd className="text-foreground text-right tabular-nums">
            {bar.totalChecks > 0 ? bar.totalChecks.toLocaleString() : "—"}
          </dd>
        </dl>
      </HoverCardContent>
    </HoverCard>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayUtcIso(): string {
  const t = new Date();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())).toISOString();
}

function groupByMonth(bars: UptimeBarDayClient[]): Month[] {
  const map = new Map<string, Month>();
  for (const b of bars) {
    const d = new Date(b.dateIso);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const key = `${year}-${month}`;
    const existing = map.get(key);
    if (existing) {
      existing.days.push(b);
    } else {
      map.set(key, { year, month, days: [b] });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  );
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatUptime(uptimeBp: number | null): string {
  if (uptimeBp == null) return "No data";
  return `${(uptimeBp / 100).toFixed(2)}%`;
}

function formatRangeLabel(bars: UptimeBarDayClient[], endDateIso: string): string {
  // When the API fetch hasn't completed yet, fall back to deriving the range
  // from the requested endDate so the label doesn't flicker.
  if (bars.length === 0) {
    const end = new Date(endDateIso);
    const start = new Date(end.getTime() - (WINDOW_DAYS - 1) * DAY_MS);
    return `${formatShort(start)} – ${formatShort(end)}`;
  }
  const first = new Date(bars[0].dateIso);
  const last = new Date(bars[bars.length - 1].dateIso);
  return `${formatShort(first)} – ${formatShort(last)}`;
}

function formatShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} aria-hidden />
      {label}
    </span>
  );
}
