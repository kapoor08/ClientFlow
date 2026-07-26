"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TimeEstimateInput } from "@/components/form";
import { useUpdateTask, useUpdateTaskAssignees } from "@/core/tasks/useCase";
import { useTeamMembers } from "@/core/team/useCase";
import {
  formatDueShort,
  PRIORITY_BADGE,
  STATUS_BADGE,
} from "@/core/tasks/entity";
import type { TaskListItem } from "@/core/tasks/entity";
import {
  TASK_PRIORITY_OPTIONS as PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS as STATUS_OPTIONS,
} from "@/constants/task";
import { getInitials } from "@/utils/user";
import { getEstimateColor } from "@/utils/task";
import { Pencil, FolderInput, Trash2, UserPlus, Check, Clock } from "lucide-react";

export function TaskListView({
  tasks,
  currentUserId,
  onTaskClick,
  onDeleteTask,
  onMoveToProject,
}: {
  tasks: TaskListItem[];
  currentUserId: string;
  onTaskClick: (task: TaskListItem) => void;
  onDeleteTask: (task: TaskListItem) => void;
  onMoveToProject: (task: TaskListItem) => void;
}) {
  const updateTask = useUpdateTask();
  const updateAssignees = useUpdateTaskAssignees();
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [, setTick] = useState(0);

  // Re-render every 30 seconds so estimate colors stay current
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Team roster via the canonical core hook (shares the `team` query cache with
  // the rest of the app instead of a bespoke ["team-task-list"] key) - P2-15.
  const { data: teamData } = useTeamMembers();
  const allMembers = teamData?.members ?? [];
  const filteredMembers = memberSearch
    ? allMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.email.toLowerCase().includes(memberSearch.toLowerCase()),
      )
    : allMembers;

  function handleNameHoverIn(task: TaskListItem) {
    hoverTimerRef.current = setTimeout(() => onTaskClick(task), 600);
  }

  function handleNameHoverOut() {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
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

  function buildPayload(
    task: TaskListItem,
    overrides: {
      status?: string;
      priority?: string | null;
      estimateMinutes?: number | null;
      dueDate?: string | null;
    },
  ) {
    return {
      projectId: task.projectId,
      title: task.title,
      status: overrides.status ?? task.status,
      priority: "priority" in overrides ? (overrides.priority ?? undefined) : (task.priority ?? undefined),
      assigneeUserId: task.assigneeUserId ?? undefined,
      dueDate:
        "dueDate" in overrides
          ? (overrides.dueDate ?? undefined)
          : (task.dueDate ?? undefined),
      estimateMinutes:
        "estimateMinutes" in overrides
          ? overrides.estimateMinutes
          : task.estimateMinutes,
      columnId: task.columnId ?? undefined,
    };
  }

  function handleStatusChange(task: TaskListItem, newStatus: string) {
    if (newStatus === task.status) return;
    updateTask.mutate({ taskId: task.id, data: buildPayload(task, { status: newStatus }) });
  }

  function handleEstimateChange(task: TaskListItem, minutes: number | null) {
    if (minutes === task.estimateMinutes) return;
    updateTask.mutate({ taskId: task.id, data: buildPayload(task, { estimateMinutes: minutes }) });
  }

  function handlePriorityChange(task: TaskListItem, newPriority: string) {
    if (newPriority === (task.priority ?? "none")) return;
    const priority = newPriority === "none" ? null : newPriority;
    updateTask.mutate({ taskId: task.id, data: buildPayload(task, { priority }) });
  }

  function handleDueDateChange(task: TaskListItem, date: Date | undefined) {
    const iso = date ? date.toISOString() : null;
    if (iso === task.dueDate) return;
    updateTask.mutate({ taskId: task.id, data: buildPayload(task, { dueDate: iso }) });
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-card border border-dashed border-border py-16">
        <p className="text-sm text-muted-foreground">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
            <TableHead className="px-2 py-2.5 w-[88px]" />
            <TableHead className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Task</TableHead>
            <TableHead className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Project</TableHead>
            <TableHead className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</TableHead>
            <TableHead className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Priority</TableHead>
            <TableHead className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Assignee</TableHead>
            <TableHead className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Due</TableHead>
            <TableHead className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Estimate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="group border-b border-border/60 last:border-0 hover:bg-secondary/40 transition-colors"
            >
              {/* Actions */}
              <TableCell className="px-2 py-3">
                <div className="flex items-center justify-end gap-1">
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Pencil size={12} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Edit task</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onMoveToProject(task); }}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                        >
                          <FolderInput size={12} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Move to project</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Delete task</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>

              {/* Title */}
              <TableCell className="px-4 py-3 max-w-72">
                <button
                  type="button"
                  onClick={() => onTaskClick(task)}
                  onMouseEnter={() => handleNameHoverIn(task)}
                  onMouseLeave={handleNameHoverOut}
                  className="block w-full text-left"
                >
                  <p className="cursor-pointer truncate font-medium text-foreground hover:text-primary transition-colors">
                    {task.title}
                  </p>
                </button>
                {task.refNumber && (
                  <p
                    className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                    onMouseEnter={() => handleNameHoverIn(task)}
                    onMouseLeave={handleNameHoverOut}
                    onClick={() => onTaskClick(task)}
                  >
                    {task.refNumber}
                  </p>
                )}
              </TableCell>

              {/* Project */}
              <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {task.projectName ?? "-"}
              </TableCell>

              {/* Status - shadcn Select styled as badge */}
              <TableCell
                className="px-4 py-3 whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                <Select value={task.status} onValueChange={(v) => handleStatusChange(task, v)}>
                  <SelectTrigger
                    className={cn(
                      "h-auto w-fit gap-1 rounded-pill border-0 px-2 py-0.5 text-xs font-medium shadow-none focus:ring-0 focus:ring-offset-0 cursor-pointer hover:opacity-80",
                      STATUS_BADGE[task.status] ?? "bg-secondary text-muted-foreground",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4} className="bg-white">
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="cursor-pointer text-xs">
                        <span className={cn("inline-flex rounded-pill px-2 py-0.5 text-xs font-medium", STATUS_BADGE[o.value] ?? "bg-secondary text-muted-foreground")}>
                          {o.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>

              {/* Priority - shadcn Select styled as badge */}
              <TableCell
                className="px-4 py-3 whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                <Select
                  value={task.priority ?? "none"}
                  onValueChange={(v) => handlePriorityChange(task, v)}
                >
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
                  <SelectContent position="popper" side="bottom" sideOffset={4} className="bg-white">
                    <SelectItem value="none" className="cursor-pointer text-xs">
                      <span className="inline-flex rounded-pill px-2 py-0.5 text-xs font-medium bg-secondary text-muted-foreground">
                        None
                      </span>
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
              </TableCell>

              {/* Assignees - multi-select avatar group */}
              <TableCell className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <Popover onOpenChange={(open) => { if (!open) setMemberSearch(""); }}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      {(() => {
                        // Fall back to legacy single-assignee field when junction table is empty
                        const effectiveAssignees =
                          (task.assignees ?? []).length > 0
                            ? task.assignees
                            : task.assigneeUserId
                            ? [{ userId: task.assigneeUserId, name: task.assigneeName }]
                            : [];
                        if (effectiveAssignees.length === 0) {
                          return (
                            <div className="flex items-center gap-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                              <UserPlus size={13} />
                              <span className="text-xs">Assign</span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex -space-x-1.5">
                            {effectiveAssignees.slice(0, 3).map((a) => (
                            <TooltipProvider key={a.userId} delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      "flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold border-2 border-card",
                                      a.userId === currentUserId
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-brand-100 text-primary",
                                    )}
                                  >
                                    {getInitials(a.name)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>{a.name ?? "Unknown"}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                            {effectiveAssignees.length > 3 && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[9px] font-medium text-muted-foreground border-2 border-card">
                                +{effectiveAssignees.length - 3}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-white p-2" align="start" side="bottom" sideOffset={4}>
                    <Input
                      placeholder="Search members…"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="mb-2 h-7 text-xs"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {filteredMembers.map((m) => {
                        const effectiveIds =
                          (task.assignees ?? []).length > 0
                            ? (task.assignees ?? []).map((a) => a.userId)
                            : task.assigneeUserId
                            ? [task.assigneeUserId]
                            : [];
                        const assigned = effectiveIds.includes(m.userId);
                        return (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => handleAssigneesChange(task, m.userId, !assigned)}
                            className={cn(
                              "flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
                              assigned
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
                            {assigned && <Check size={12} className="shrink-0 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>

              {/* Due - inline date picker */}
              <TableCell className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <Popover>
                  <TooltipProvider delayDuration={400}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                          >
                            {task.dueDate ? (
                              <>
                                <Clock size={11} />
                                {formatDueShort(task.dueDate)}
                              </>
                            ) : (
                              <span className="text-muted-foreground/50">Click to set due date</span>
                            )}
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Click to set due date</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <PopoverContent className="w-auto bg-white p-0" align="start" side="bottom" sideOffset={4}>
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
              </TableCell>

              {/* Estimate - TimeEstimateInput with elapsed-time color */}
              <TableCell className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <TimeEstimateInput
                  value={task.estimateMinutes}
                  onChange={(minutes) => handleEstimateChange(task, minutes)}
                  size="sm"
                  displayPlaceholder="Click to set estimate"
                  tooltip="Click to set estimate (e.g. 1w 2d 3h 30m)"
                  className={getEstimateColor(task)}
                />
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
