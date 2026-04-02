"use client";

import { useState } from "react";
import { Clock, ListTodo, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/core/tasks/useCase";
import {
  getInitials,
  formatDueShort,
  PRIORITY_BADGE,
  STATUS_BADGE,
} from "@/core/tasks/entity";
import type { TaskListItem } from "@/core/tasks/entity";
import { TaskDialog } from "@/app/(protected)/tasks/TaskDialog";

type Props = {
  projectId: string;
  canWrite: boolean;
};

export function ProjectTasksSection({ projectId, canWrite }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);

  const { data, isLoading } = useTasks({ projectId, pageSize: 100 });
  const tasks = data?.tasks ?? [];

  function openCreate() {
    setSelectedTask(null);
    setDialogOpen(true);
  }

  function openEdit(task: TaskListItem) {
    setSelectedTask(task);
    setDialogOpen(true);
  }

  function handleClose() {
    setDialogOpen(false);
    setSelectedTask(null);
  }

  return (
    <>
      <div className="rounded-card border border-border bg-card shadow-cf-1">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ListTodo size={15} className="text-muted-foreground" />
            Tasks
            {!isLoading && (
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {tasks.length}
              </span>
            )}
          </div>
          {canWrite && (
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              onClick={openCreate}
            >
              <Plus size={13} />
              New Task
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <ListTodo size={28} className="text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              No tasks yet
            </p>
            {canWrite && (
              <p className="text-xs text-muted-foreground/70">
                Click &quot;New Task&quot; to add the first task to this
                project.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Task
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">
                  Priority
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                  Assignee
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
                  onClick={() => openEdit(task)}
                  className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {task.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[task.status] ?? ""}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {task.priority ? (
                      <span
                        className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_BADGE[task.priority] ?? ""}`}
                      >
                        {task.priority}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {task.assigneeUserId ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-primary">
                          {getInitials(task.assigneeName)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {task.assigneeName ?? task.assigneeUserId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                    {task.dueDate ? (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDueShort(task.dueDate)}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onClose={handleClose}
        mode={selectedTask ? "edit" : "create"}
        task={selectedTask}
        defaultProjectId={projectId}
      />
    </>
  );
}
