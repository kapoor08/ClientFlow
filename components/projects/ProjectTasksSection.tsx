"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock, ListTodo, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { http } from "@/core/infrastructure";
import { TimeEstimateInput } from "@/components/form";
import { useTasks, useUpdateTask, useUpdateTaskAssignees } from "@/core/tasks/useCase";
import {
  formatDueShort,
  PRIORITY_BADGE,
  STATUS_BADGE,
} from "@/core/tasks/entity";
import { getInitials } from "@/utils/user";
import { getEstimateColor } from "@/utils/task";
import type { TaskListItem } from "@/core/tasks/entity";
import { CreateTaskDialog } from "@/app/(protected)/tasks/components/CreateTaskDialog";
import { TaskDetailSheet } from "@/app/(protected)/tasks/components/TaskDetailSheet";

// ─── Types ─────────────────────────────────────────────────────────────────────

type MemberOption = { userId: string; name: string; email: string };

const STATUS_OPTIONS = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "testing_qa", label: "Testing / QA" },
  { value: "completed", label: "Completed" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPayload(
  task: TaskListItem,
  overrides: {
    status?: string;
    priority?: string | null;
    dueDate?: string | null;
    estimateMinutes?: number | null;
  },
) {
  return {
    projectId: task.projectId,
    title: task.title,
    status: overrides.status ?? task.status,
    priority: "priority" in overrides ? (overrides.priority ?? undefined) : (task.priority ?? undefined),
    assigneeUserId: task.assigneeUserId ?? undefined,
    dueDate: "dueDate" in overrides ? (overrides.dueDate ?? undefined) : (task.dueDate ?? undefined),
    estimateMinutes: "estimateMinutes" in overrides ? overrides.estimateMinutes : task.estimateMinutes,
    columnId: task.columnId ?? undefined,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  projectId: string;
  canWrite: boolean;
  currentUserId?: string;
};

export function ProjectTasksSection({ projectId, canWrite, currentUserId }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");

  const { data, isLoading } = useTasks({ projectId, pageSize: 100 });
  const tasks = data?.tasks ?? [];

  const updateTask = useUpdateTask();
  const updateAssignees = useUpdateTaskAssignees();

  const { data: teamData } = useQuery({
    queryKey: ["team-task-list"],
    queryFn: () => http<{ members: MemberOption[] }>("/api/team").then((r) => ({ members: r.members ?? [] })),
    staleTime: 60 * 1000,
  });
  const allMembers = teamData?.members ?? [];
  const filteredMembers = memberSearch
    ? allMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.email.toLowerCase().includes(memberSearch.toLowerCase()),
      )
    : allMembers;

  function handleStatusChange(task: TaskListItem, newStatus: string) {
    if (newStatus === task.status) return;
    updateTask.mutate({ taskId: task.id, data: buildPayload(task, { status: newStatus }) });
  }

  function handlePriorityChange(task: TaskListItem, newPriority: string) {
    if (newPriority === (task.priority ?? "none")) return;
    const priority = newPriority === "none" ? null : newPriority;
    updateTask.mutate({ taskId: task.id, data: buildPayload(task, { priority }) });
  }

  function handleAssigneesChange(task: TaskListItem, userId: string, add: boolean) {
    const assignees = task.assignees ?? [];
    const current =
      assignees.length > 0
        ? assignees.map((a) => a.userId)
        : task.assigneeUserId
          ? [task.assigneeUserId]
          : [];
    const next = add
      ? [...current.filter((id) => id !== userId), userId]
      : current.filter((id) => id !== userId);
    updateAssignees.mutate({ taskId: task.id, userIds: next });
  }

  function handleEstimateChange(task: TaskListItem, minutes: number | null) {
    if (minutes === task.estimateMinutes) return;
    updateTask.mutate({ taskId: task.id, data: buildPayload(task, { estimateMinutes: minutes }) });
  }

  function handleDueDateChange(task: TaskListItem, date: Date | undefined) {
    const iso = date ? date.toISOString() : null;
    if (iso === task.dueDate) return;
    updateTask.mutate({ taskId: task.id, data: buildPayload(task, { dueDate: iso }) });
  }

  return (
    <>
      <div className="rounded-card border border-border bg-card shadow-cf-1">
        {/* Header */}
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
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setCreateOpen(true)}>
              <Plus size={13} /> New Task
            </Button>
          )}
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <ListTodo size={28} className="text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
            {canWrite && (
              <p className="text-xs text-muted-foreground/70">
                Click &quot;New Task&quot; to add the first task.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Task</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground sm:table-cell">Priority</th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground md:table-cell">Assignee</th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground lg:table-cell">Due</th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground xl:table-cell">Estimate</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const effectiveAssignees =
                    (task.assignees ?? []).length > 0
                      ? task.assignees
                      : task.assigneeUserId
                        ? [{ userId: task.assigneeUserId, name: task.assigneeName }]
                        : [];

                  const isOverdue =
                    task.dueDate &&
                    task.status !== "done" &&
                    new Date(task.dueDate) < new Date();

                  return (
                    <tr
                      key={task.id}
                      className="group border-b border-border/60 last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      {/* Task name - opens detail sheet */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskId(task.id)}
                          className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1"
                        >
                          {task.title}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Select value={task.status} onValueChange={(v) => handleStatusChange(task, v)}>
                          <SelectTrigger
                            className={cn(
                              "h-auto w-fit gap-1 rounded-pill border-0 px-2 py-0.5 text-xs font-medium shadow-none focus:ring-0 focus:ring-offset-0 cursor-pointer hover:opacity-80",
                              STATUS_BADGE[task.status] ?? "bg-secondary text-muted-foreground",
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" side="bottom" sideOffset={4}>
                            {STATUS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value} className="cursor-pointer text-xs">
                                <span className={cn("inline-flex rounded-pill px-2 py-0.5 text-xs font-medium", STATUS_BADGE[o.value] ?? "bg-secondary text-muted-foreground")}>
                                  {o.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Priority */}
                      <td className="hidden px-4 py-3 sm:table-cell" onClick={(e) => e.stopPropagation()}>
                        <Select value={task.priority ?? "none"} onValueChange={(v) => handlePriorityChange(task, v)}>
                          <SelectTrigger
                            className={cn(
                              "h-auto w-fit gap-1 rounded-pill border-0 px-2 py-0.5 text-xs font-medium shadow-none focus:ring-0 focus:ring-offset-0 cursor-pointer hover:opacity-80 capitalize",
                              task.priority
                                ? (PRIORITY_BADGE[task.priority] ?? "bg-secondary text-muted-foreground")
                                : "bg-secondary text-muted-foreground",
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" side="bottom" sideOffset={4}>
                            <SelectItem value="none" className="cursor-pointer text-xs">
                              <span className="inline-flex rounded-pill px-2 py-0.5 text-xs font-medium bg-secondary text-muted-foreground">None</span>
                            </SelectItem>
                            {PRIORITY_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value} className="cursor-pointer text-xs">
                                <span className={cn("inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize", PRIORITY_BADGE[o.value] ?? "bg-secondary text-muted-foreground")}>
                                  {o.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Assignee */}
                      <td className="hidden px-4 py-3 md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <Popover onOpenChange={(open) => { if (!open) setMemberSearch(""); }}>
                          <PopoverTrigger asChild>
                            <button type="button" className="flex items-center gap-1 cursor-pointer min-w-[80px]">
                              {effectiveAssignees.length > 0 ? (
                                <div className="flex -space-x-1">
                                  {effectiveAssignees.slice(0, 3).map((a) => (
                                    <TooltipProvider key={a.userId} delayDuration={300}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className={cn(
                                            "flex h-6 w-6 items-center justify-center rounded-full border border-card text-[9px] font-semibold",
                                            a.userId === currentUserId
                                              ? "bg-primary text-primary-foreground"
                                              : "bg-brand-100 text-primary",
                                          )}>
                                            {getInitials(a.name)}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>{a.name ?? "Unknown"}</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                                  {effectiveAssignees.length > 3 && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-card bg-secondary text-[9px] font-medium text-muted-foreground">
                                      +{effectiveAssignees.length - 3}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground/50 hover:text-muted-foreground">Unassigned</span>
                              )}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2" align="start" side="bottom" sideOffset={4}>
                            <Input
                              placeholder="Search members…"
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              className="mb-2 h-7 text-xs"
                            />
                            <div className="max-h-48 overflow-y-auto space-y-0.5">
                              {filteredMembers.map((m) => {
                                const isAssigned = effectiveAssignees.some((a) => a.userId === m.userId);
                                return (
                                  <button
                                    key={m.userId}
                                    type="button"
                                    onClick={() => handleAssigneesChange(task, m.userId, !isAssigned)}
                                    className={cn(
                                      "flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
                                      isAssigned
                                        ? "bg-secondary text-foreground font-medium"
                                        : "hover:bg-secondary/50 text-muted-foreground",
                                    )}
                                  >
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-primary">
                                      {getInitials(m.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-foreground">{m.name}</p>
                                      <p className="truncate text-muted-foreground">{m.email}</p>
                                    </div>
                                    {isAssigned && <Check size={12} className="shrink-0 text-primary" />}
                                  </button>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </td>

                      {/* Due Date */}
                      <td className="hidden px-4 py-3 lg:table-cell" onClick={(e) => e.stopPropagation()}>
                        <Popover>
                          <TooltipProvider delayDuration={400}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className={cn(
                                      "flex items-center gap-1 text-xs transition-colors hover:text-foreground cursor-pointer",
                                      isOverdue ? "text-danger font-medium" : "text-muted-foreground",
                                    )}
                                  >
                                    {task.dueDate ? (
                                      <><Clock size={11} />{formatDueShort(task.dueDate)}</>
                                    ) : (
                                      <span className="text-muted-foreground/50">Set due date</span>
                                    )}
                                  </button>
                                </PopoverTrigger>
                              </TooltipTrigger>
                              <TooltipContent>Click to set due date</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                            <Calendar
                              mode="single"
                              selected={task.dueDate ? new Date(task.dueDate) : undefined}
                              onSelect={(date) => handleDueDateChange(task, date)}
                              initialFocus
                            />
                            {task.dueDate && (
                              <div className="border-t border-border px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => handleDueDateChange(task, undefined)}
                                  className="text-xs text-muted-foreground hover:text-danger transition-colors cursor-pointer"
                                >
                                  Clear date
                                </button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </td>
                      {/* Estimate */}
                      <td className="hidden px-4 py-3 xl:table-cell" onClick={(e) => e.stopPropagation()}>
                        <TimeEstimateInput
                          value={task.estimateMinutes}
                          onChange={(minutes) => handleEstimateChange(task, minutes)}
                          size="sm"
                          displayPlaceholder="Set estimate"
                          tooltip="Click to set estimate (e.g. 1w 2d 3h 30m)"
                          className={getEstimateColor(task)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultProjectId={projectId}
      />

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        currentUserId={currentUserId}
      />
    </>
  );
}
