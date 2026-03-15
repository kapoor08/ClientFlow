import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockTasks } from "@/data/mockData";
import type { Task } from "@/types/models";
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

const priorityBadge: Record<string, string> = {
  low: "bg-neutral-300/50 text-neutral-700",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-danger/10 text-danger",
};

const statusBadge: Record<string, string> = {
  todo: "bg-neutral-300/50 text-neutral-700",
  in_progress: "bg-info/10 text-info",
  review: "bg-warning/10 text-warning",
  blocked: "bg-danger/10 text-danger",
  done: "bg-success/10 text-success",
};

const TaskCard = ({ task }: { task: Task }) => (
  <div className="group rounded-card border border-border bg-card p-3 shadow-cf-1 hover:shadow-cf-2 transition-shadow cursor-pointer">
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
    <div className="mt-2.5 flex flex-wrap gap-1">
      {task.tags.map((tag) => (
        <span
          key={tag}
          className="rounded-pill bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          {tag}
        </span>
      ))}
    </div>
    <div className="mt-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-primary">
          {task.assignee.initials}
        </div>
        <span
          className={`rounded-pill px-1.5 py-0.5 text-[10px] font-medium capitalize ${priorityBadge[task.priority]}`}
        >
          {task.priority}
        </span>
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
        <span className="flex items-center gap-0.5">
          <Clock size={10} /> {task.dueDate.slice(5)}
        </span>
      </div>
    </div>
  </div>
);

const TasksPage = () => {
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");

  const filtered = mockTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.projectName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            {mockTasks.length} tasks across all projects
          </p>
        </div>
        <Button>
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

      {view === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((col) => {
            const tasks = filtered.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="min-w-65 flex-1">
                <div
                  className={`mb-3 flex items-center gap-2 border-l-2 pl-2 ${col.color}`}
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    {col.label}
                  </h3>
                  <span className="rounded-full bg-secondary px-1.5 text-xs font-medium text-muted-foreground">
                    {tasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
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
              {filtered.map((task) => (
                <tr
                  key={task.id}
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
                      className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[task.status]}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span
                      className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${priorityBadge[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-primary">
                        {task.assignee.initials}
                      </div>
                      <span className="text-muted-foreground">
                        {task.assignee.name}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {task.dueDate}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
