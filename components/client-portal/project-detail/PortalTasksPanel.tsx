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
        <h2 className="font-display text-foreground text-base font-semibold">Tasks</h2>
        <span className="text-muted-foreground ml-auto text-xs">
          {openTasks.length} open · {doneTasks.length} done
        </span>
      </div>

      <div className="rounded-card border-border bg-card shadow-cf-1 overflow-hidden border">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground px-5 py-10 text-center text-sm">No tasks yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border bg-secondary/50 border-b">
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold">
                  Task
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold">
                  Status
                </th>
                <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold md:table-cell">
                  Due
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-border hover:bg-secondary/30 border-b last:border-0"
                >
                  <td className="text-foreground px-4 py-3 font-medium">{task.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-pill inline-flex items-center px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status] ?? "bg-secondary text-muted-foreground"}`}
                    >
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {task.dueDate ? (
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Clock size={11} />
                        {new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
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
