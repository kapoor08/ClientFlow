import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardTask } from "@/core/dashboard/entity";
import {
  formatDueDate,
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
} from "@/core/dashboard/entity";

// ─── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({ task }: { task: DashboardTask }) {
  const { label, isOverdue } = formatDueDate(task.dueDate);
  const statusLabel = TASK_STATUS_LABELS[task.status] ?? task.status;
  const statusStyle =
    TASK_STATUS_STYLES[task.status] ?? "bg-secondary text-muted-foreground";

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
        {task.projectName ?? "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <span
          className={`flex items-center gap-1 text-xs ${isOverdue ? "font-medium text-danger" : "text-muted-foreground"}`}
        >
          <Clock size={12} />
          {label}
        </span>
      </td>
    </tr>
  );
}

// ─── RecentTasksList ──────────────────────────────────────────────────────────

export function RecentTasksList({ tasksDueSoon }: { tasksDueSoon: DashboardTask[] }) {
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Tasks Due Soon
        </h2>
        <Button variant="default" size="sm" asChild>
          <Link href="/tasks" className="flex items-center gap-1">
            View All <ArrowUpRight size={14} />
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Task
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">
                Project
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Due
              </th>
            </tr>
          </thead>
          <tbody>
            {tasksDueSoon.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No tasks due in the next 7 days.
                </td>
              </tr>
            ) : (
              tasksDueSoon.map((task) => <TaskRow key={task.id} task={task} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
