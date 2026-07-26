import { CheckSquare, Clock } from "lucide-react";
import type { getPortalProjectDetailForUser } from "@/server/client-portal";
import { STATUS_STYLES, STATUS_LABELS } from "./status-config";

type PortalTask = NonNullable<
  Awaited<ReturnType<typeof getPortalProjectDetailForUser>>
>["tasks"][number];

export function PortalTasksPanel({ tasks }: { tasks: PortalTask[] }) {
  const openTasks = tasks.filter((t) => !["done", "completed"].includes(t.status));
  const doneTasks = tasks.filter((t) => ["done", "completed"].includes(t.status));

  return (
    <div className="lg:col-span-3">
      <div className="mb-4 flex items-center gap-2">
        <CheckSquare size={16} className="text-muted-foreground" />
        <h2 className="font-display text-base font-semibold text-foreground">Tasks</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {openTasks.length} open · {doneTasks.length} done
        </span>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        {tasks.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No tasks yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Task
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
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status] ?? "bg-secondary text-muted-foreground"}`}
                    >
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {task.dueDate ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={11} />
                        {new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
