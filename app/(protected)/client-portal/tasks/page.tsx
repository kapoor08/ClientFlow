import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { getPortalTasksForUser } from "@/server/client-portal";
import { CheckSquare, Clock } from "lucide-react";
import {
  TASK_STATUS_LABELS,
  STATUS_BADGE,
  PRIORITY_BADGE as PRIORITY_STYLES,
} from "@/core/tasks/entity";
import { EmptyState } from "@/components/shared";

// Portal-specific override: legacy "completed" key (canonical uses "done")
const STATUS_STYLES: Record<string, string> = { ...STATUS_BADGE, completed: STATUS_BADGE.done };
const STATUS_LABELS: Record<string, string> = { ...TASK_STATUS_LABELS, completed: "Done" };

export default async function ClientPortalTasksPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx || ctx.roleKey !== "client") redirect("/dashboard");

  const tasks = await getPortalTasksForUser(session.user.id);
  if (!tasks) redirect("/dashboard");

  const openTasks = tasks.filter((t) => !["done", "completed"].includes(t.status));
  const doneTasks = tasks.filter((t) => ["done", "completed"].includes(t.status));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Tasks
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {openTasks.length} open · {doneTasks.length} completed
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Tasks across your projects will appear here."
        />
      ) : (
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
                  Priority
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">
                  Due
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {task.title}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {task.projectName ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status] ?? "bg-secondary text-muted-foreground"}`}
                    >
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {task.priority ? (
                      <span
                        className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[task.priority] ?? ""}`}
                      >
                        {task.priority}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
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
        </div>
      )}
    </div>
  );
}
