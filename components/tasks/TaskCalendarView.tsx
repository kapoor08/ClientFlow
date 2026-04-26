"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import type { TaskListItem } from "@/core/tasks/entity";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-blue-500",
  low: "bg-slate-400",
};

const STATUS_CHIP: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-muted text-muted-foreground border-border line-through",
  in_progress: "bg-info/10 text-info border-info/20",
  in_review: "bg-violet-500/10 text-violet-600 border-violet-200",
  testing: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  todo: "bg-secondary text-foreground border-border",
};

function chipClass(status: string): string {
  return STATUS_CHIP[status] ?? STATUS_CHIP.todo;
}

type Props = {
  tasks: TaskListItem[];
  onTaskClick: (task: TaskListItem) => void;
};

/**
 * Month-grid calendar view for tasks with a due date. Tasks without a due
 * date are surfaced in a banner at the top so they don't get lost.
 */
export function TaskCalendarView({ tasks, onTaskClick }: Props) {
  const [cursor, setCursor] = useState<Date>(() => new Date());

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const { scheduled, unscheduled } = useMemo(() => {
    const scheduledMap = new Map<string, TaskListItem[]>();
    const unscheduledList: TaskListItem[] = [];
    for (const t of tasks) {
      if (!t.dueDate) {
        unscheduledList.push(t);
        continue;
      }
      const key = format(new Date(t.dueDate), "yyyy-MM-dd");
      const existing = scheduledMap.get(key);
      if (existing) existing.push(t);
      else scheduledMap.set(key, [t]);
    }
    return { scheduled: scheduledMap, unscheduled: unscheduledList };
  }, [tasks]);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="rounded-card border-border bg-card flex flex-wrap items-center justify-between gap-2 border px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={14} />
          </button>
          <h2 className="text-foreground min-w-[10rem] text-center text-sm font-semibold">
            {format(cursor, "MMMM yyyy")}
          </h2>
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground ml-1 flex h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors"
          >
            <CalendarDays size={12} /> Today
          </button>
        </div>
        <div className="text-muted-foreground flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Urgent
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-400" /> Low
          </span>
        </div>
      </div>

      {/* Unscheduled tasks banner */}
      {unscheduled.length > 0 && (
        <div className="rounded-card border-warning/30 bg-warning/5 flex flex-wrap items-start gap-2 border px-3 py-2">
          <AlertCircle size={13} className="text-warning mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-xs font-medium">
              {unscheduled.length} task{unscheduled.length === 1 ? "" : "s"} without a due date
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {unscheduled.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTaskClick(t)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors hover:opacity-80",
                    chipClass(t.status),
                  )}
                >
                  {t.priority && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        PRIORITY_DOT[t.priority] ?? PRIORITY_DOT.low,
                      )}
                    />
                  )}
                  <span className="max-w-[14rem] truncate">{t.title}</span>
                </button>
              ))}
              {unscheduled.length > 8 && (
                <span className="text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-[11px]">
                  +{unscheduled.length - 8} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Month grid */}
      <div className="rounded-card border-border bg-card overflow-hidden border">
        {/* Weekday headers */}
        <div className="border-border bg-secondary/30 grid grid-cols-7 border-b">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="text-muted-foreground px-2 py-1.5 text-center text-[10px] font-semibold tracking-wide uppercase"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayTasks = scheduled.get(dayKey) ?? [];
            const inMonth = isSameMonth(day, cursor);
            const today = isToday(day);
            const pastDue = day < new Date() && !today;

            return (
              <div
                key={dayKey}
                className={cn(
                  "border-border relative min-h-[6rem] border-r border-b p-1.5",
                  !inMonth && "bg-secondary/10",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                      today
                        ? "bg-primary text-primary-foreground"
                        : inMonth
                          ? "text-foreground"
                          : "text-muted-foreground/50",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayTasks.length > 3 && (
                    <span className="text-muted-foreground text-[9px] font-medium">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onTaskClick(t)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-1 rounded border px-1 py-0.5 text-left text-[10.5px] font-medium transition-colors hover:opacity-80",
                        chipClass(t.status),
                        // Overdue highlight: due before today, not completed
                        pastDue &&
                          t.status !== "completed" &&
                          t.status !== "cancelled" &&
                          "ring-danger/40 ring-1",
                      )}
                      title={t.title}
                    >
                      {t.priority && (
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            PRIORITY_DOT[t.priority] ?? PRIORITY_DOT.low,
                          )}
                        />
                      )}
                      <span className="min-w-0 truncate">{t.title}</span>
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        // Open the first overflow task - simple, keeps interaction obvious.
                        // (Users can inspect the rest in the list view.)
                        const overflow = dayTasks[3];
                        if (overflow) onTaskClick(overflow);
                      }}
                      className="text-muted-foreground hover:bg-secondary/50 w-full cursor-pointer rounded px-1 py-0.5 text-left text-[10px]"
                    >
                      + {dayTasks.length - 3} more…
                    </button>
                  )}
                </div>

                {/* Today marker (subtle corner accent) */}
                {today && (
                  <span className="bg-primary pointer-events-none absolute top-1 right-1 h-1 w-1 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-muted-foreground text-[11px]">
        Showing {tasks.length} task{tasks.length === 1 ? "" : "s"} - click any task to open its
        details.
      </p>
    </div>
  );
}
