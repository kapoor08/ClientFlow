"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/core/tasks/useCase";
import { getInitials, formatDueShort, PRIORITY_BADGE, STATUS_BADGE } from "@/core/tasks/entity";
import type { TaskListItem } from "@/core/tasks/entity";
import { TaskDialog } from "./TaskDialog";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  MessageSquare,
  Paperclip,
  Clock,
  GripVertical,
} from "lucide-react";

const statusColumns = [
  { key: "todo", label: "To Do", color: "border-neutral-300" },
  { key: "in_progress", label: "In Progress", color: "border-info" },
  { key: "review", label: "Review", color: "border-warning" },
  { key: "blocked", label: "Blocked", color: "border-danger" },
  { key: "done", label: "Done", color: "border-success" },
] as const;

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onClick,
}: {
  task: TaskListItem;
  onClick: () => void;
}) {
  const initials = getInitials(task.assigneeName);

  return (
    <div
      onClick={onClick}
      className="group rounded-card border border-border bg-card p-3 shadow-cf-1 hover:shadow-cf-2 transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-foreground leading-tight">
          {task.title}
        </p>
        <GripVertical
          size={14}
          className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{task.projectName}</p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assigneeUserId ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-primary">
              {initials}
            </div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground">
              ?
            </div>
          )}
          {task.priority && (
            <span
              className={`rounded-pill px-1.5 py-0.5 text-[10px] font-medium capitalize ${PRIORITY_BADGE[task.priority] ?? ""}`}
            >
              {task.priority}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {task.commentCount > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare size={10} /> {task.commentCount}
            </span>
          )}
          {task.attachmentCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Paperclip size={10} /> {task.attachmentCount}
            </span>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-0.5">
              <Clock size={10} /> {formatDueShort(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ height: "calc(100vh - 14.75rem)" }}>
      {statusColumns.map((col) => (
        <div key={col.key} className="min-w-65 flex-1">
          <div className={`mb-3 flex items-center gap-2 border-l-2 pl-2 ${col.color}`}>
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-card" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
      <div className="border-b border-border bg-secondary/50 px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TasksPage = () => {
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);

  const { data, isLoading } = useTasks({ pageSize: 200 });
  const allTasks = data?.tasks ?? [];

  const filtered = search
    ? allTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.projectName ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : allTasks;

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
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${allTasks.length} tasks across all projects`}
          </p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus size={16} className="mr-1.5" /> New Task
        </Button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setView("board")}
            className={`rounded-l-lg px-2.5 py-1.5 ${view === "board" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-r-lg px-2.5 py-1.5 ${view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        view === "board" ? <BoardSkeleton /> : <ListSkeleton />
      ) : view === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ height: "calc(100vh - 14.75rem)" }}>
          {statusColumns.map((col) => {
            const tasks = filtered.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="min-w-65 flex-1 flex flex-col">
                <div
                  className={`mb-3 shrink-0 flex items-center gap-2 border-l-2 pl-2 ${col.color}`}
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    {col.label}
                  </h3>
                  <span className="rounded-full bg-secondary px-1.5 text-xs font-medium text-muted-foreground">
                    {tasks.length}
                  </span>
                </div>
                <div className="overflow-y-auto space-y-2 pr-0.5">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={() => openEdit(task)} />
                  ))}
                  {tasks.length === 0 && (
                    <div className="rounded-card border border-dashed border-border bg-card/50 p-4 text-center text-xs text-muted-foreground">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Task
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Project
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Priority
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Assignee
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Due
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No tasks found.
                  </td>
                </tr>
              )}
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => openEdit(task)}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground md:hidden">
                      {task.projectName}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {task.projectName}
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
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {task.assigneeUserId ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-primary">
                          {getInitials(task.assigneeName)}
                        </div>
                        <span className="text-muted-foreground">
                          {task.assigneeName ?? task.assigneeUserId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                    {task.dueDate ? (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {formatDueShort(task.dueDate)}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskDialog
        open={dialogOpen}
        onClose={handleClose}
        mode={selectedTask ? "edit" : "create"}
        task={selectedTask}
      />
    </div>
  );
};

export default TasksPage;
