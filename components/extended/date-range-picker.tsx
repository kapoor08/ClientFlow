"use client";

import * as React from "react";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type { DateRange };

interface DateRangePickerProps {
  initialDateFrom?: Date;
  initialDateTo?: Date;
  onUpdate?: (values: { range: { from?: Date; to?: Date } }) => void;
  showCompare?: boolean;
  align?: "start" | "center" | "end";
  fullMonthMode?: boolean;
  disableFutureDates?: boolean;
  disablePastDates?: boolean;
}

const PRESETS: { label: string; getDates: () => { from: Date; to: Date } }[] = [
  {
    label: "Today",
    getDates: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Yesterday",
    getDates: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    label: "Last 7 days",
    getDates: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 14 days",
    getDates: () => ({
      from: startOfDay(subDays(new Date(), 13)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    getDates: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "This Week",
    getDates: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 0 }),
      to: endOfWeek(new Date(), { weekStartsOn: 0 }),
    }),
  },
  {
    label: "Last Week",
    getDates: () => {
      const start = startOfWeek(subDays(new Date(), 7), { weekStartsOn: 0 });
      return { from: start, to: endOfWeek(start, { weekStartsOn: 0 }) };
    },
  },
  {
    label: "This Month",
    getDates: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last Month",
    getDates: () => {
      const start = startOfMonth(subDays(startOfMonth(new Date()), 1));
      return { from: start, to: endOfMonth(start) };
    },
  },
];

function formatTriggerLabel(from?: Date, to?: Date): string {
  if (!from) return "Select dates...";
  if (!to || from.toDateString() === to.toDateString()) {
    return format(from, "MMM d, yyyy");
  }
  return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
}

export function DateRangePicker({
  initialDateFrom,
  initialDateTo,
  onUpdate,
  align = "end",
  disableFutureDates = false,
  disablePastDates = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  // committed: the applied range shown in the trigger button
  const [committed, setCommitted] = React.useState<{
    from?: Date;
    to?: Date;
  }>({ from: initialDateFrom, to: initialDateTo });

  // pending: staged selection while the popover is open
  const [pending, setPending] = React.useState<{ from?: Date; to?: Date }>({
    from: initialDateFrom,
    to: initialDateTo,
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      // Sync pending to committed when opening
      setPending({ from: committed.from, to: committed.to });
    }
    setOpen(next);
  }

  function handleUpdate() {
    setCommitted({ from: pending.from, to: pending.to });
    onUpdate?.({ range: { from: pending.from, to: pending.to } });
    setOpen(false);
  }

  function handleReset() {
    setPending({ from: undefined, to: undefined });
    setCommitted({ from: undefined, to: undefined });
    onUpdate?.({ range: { from: undefined, to: undefined } });
    setOpen(false);
  }

  function handleCancel() {
    setPending({ from: committed.from, to: committed.to });
    setOpen(false);
  }

  const disabledMatcher = disableFutureDates
    ? { after: new Date() }
    : disablePastDates
      ? { before: new Date() }
      : undefined;

  const hasValue = !!committed.from;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 gap-1.5 border-border bg-white text-sm font-normal cursor-pointer",
            !hasValue && "text-muted-foreground",
          )}
        >
          <CalendarIcon size={14} className="shrink-0" />
          <span>{formatTriggerLabel(committed.from, committed.to)}</span>
          <ChevronDown
            size={14}
            className="ml-0.5 shrink-0 text-muted-foreground"
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 overflow-hidden"
        align={align}
        sideOffset={6}
      >
        <div className="flex">
          {/* Preset shortcuts */}
          <div className="flex w-36 flex-col gap-0.5 border-r border-border p-2">
            {PRESETS.map((preset) => {
              const dates = preset.getDates();
              const isActive =
                pending.from?.toDateString() === dates.from.toDateString() &&
                pending.to?.toDateString() === dates.to.toDateString();
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPending(preset.getDates())}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-left text-sm transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Calendar + actions */}
          <div className="flex flex-col">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={{ from: pending.from, to: pending.to } as DateRange}
              onSelect={(r) =>
                setPending({
                  from: r?.from ?? undefined,
                  to: r?.to ?? undefined,
                })
              }
              disabled={disabledMatcher}
            />

            <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="cursor-pointer"
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={!pending.from}
                className="cursor-pointer"
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
