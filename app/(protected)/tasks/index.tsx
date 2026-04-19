"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQueryState } from "nuqs";
import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTasks, useMoveTask, useReorderTasks, useDeleteTask, useUpdateTask, useUpdateTaskAssignees } from "@/core/tasks/useCase";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/infrastructure";
import { TimeEstimateInput } from "@/components/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useBoardColumns,
  useDeleteColumn,
  useReorderColumns,
} from "@/core/task-columns/useCase";
import {
  formatDueShort,
  PRIORITY_BADGE,
  STATUS_BADGE,
} from "@/core/tasks/entity";
import {
  TASK_PRIORITY_OPTIONS as PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS as STATUS_OPTIONS,
} from "@/constants/task";
import { getInitials } from "@/utils/user";
import { getEstimateColor } from "@/utils/task";
import type {
  TaskListItem,
  TaskListResponse,
} from "@/core/tasks/entity";
import type {
  BoardColumn,
  BoardColumnsResponse,
} from "@/core/task-columns/entity";
import { TaskCalendarView } from "@/components/tasks/TaskCalendarView";
import {
  EditColumnDialog,
  FiltersDrawer,
  type ExtendedFilters,
  CreateTaskDialog,
  TaskDetailSheet,
  DeleteTaskDialog,
  DeleteColumnDialog,
  MoveToProjectDialog,
} from "@/components/tasks";
import {
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  MessageSquare,
  Paperclip,
  SlidersHorizontal,
  UserCheck,
  Trash2,
  Pencil,
  LayoutGrid,
  List,
  CalendarRange,
  FolderInput,
  Check,
  UserPlus,
} from "lucide-react";

// ─── Status → ColumnType mapping ──────────────────────────────────────────────

function statusMatchesColumnType(
  status: string,
  columnType: string | null,
): boolean {
  if (!columnType) return false;
  const map: Record<string, string[]> = {
    todo: ["todo", "backlog"],
    in_progress: ["in_progress"],
    testing_qa: ["review", "testing"],
    completed: ["done", "completed"],
  };
  return map[columnType]?.includes(status) ?? false;
}

// ─── Tag colors ────────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  bug: "bg-danger/10 text-danger border-danger/20",
  enhancement: "bg-info/10 text-info border-info/20",
  feature: "bg-success/10 text-success border-success/20",
  improvement: "bg-warning/10 text-warning border-warning/20",
  question: "bg-purple-100 text-purple-700 border-purple-200",
  documentation: "bg-neutral-100 text-neutral-600 border-neutral-200",
  design: "bg-pink-100 text-pink-700 border-pink-200",
  blocked: "bg-danger/20 text-danger border-danger/30",
};

// ─── Sortable Task Card ────────────────────────────────────────────────────────

function SortableTaskCard({
  task,
  currentUserId,
  onClick,
  onDelete,
  onMoveToProject,
  isDragOverlay,
}: {
  task: TaskListItem;
  currentUserId: string;
  onClick: () => void;
  onDelete: (task: TaskListItem) => void;
  onMoveToProject: (task: TaskListItem) => void;
  isDragOverlay?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

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

  const priorityAccent: Record<string, string> = {
    urgent: "border-l-red-500",
    high: "border-l-orange-400",
    medium: "border-l-yellow-400",
    low: "border-l-zinc-400",
  };

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? {} : style}
      {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
      onClick={onClick}
      className={cn(
        "group rounded-card border border-border border-l-[3px] bg-card px-3 py-2.5 shadow-cf-1 transition-all cursor-pointer select-none",
        task.priority ? priorityAccent[task.priority] : "border-l-border",
        isDragOverlay
          ? "rotate-1 shadow-cf-3"
          : "hover:shadow-cf-2 hover:border-border/80",
      )}
    >
      {/* Header: ref + menu */}
      <div className="flex items-center justify-between gap-1 mb-1">
        {task.refNumber && (
          <span className="text-[10px] text-muted-foreground/60 font-mono select-none">
            {task.refNumber}
          </span>
        )}
        <div className="relative ml-auto shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
            aria-label="Task options"
          >
            <MoreHorizontal size={13} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
              />
              <div className="absolute right-0 top-6 z-20 min-w-40 rounded-card border border-border bg-card shadow-cf-2 py-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onMoveToProject(task); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  <FolderInput size={13} /> Move to Project
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(task); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} /> Delete Task
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
        {task.title}
      </p>

      {/* Project */}
      {task.projectName && (
        <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
          {task.projectName}
        </p>
      )}

      {/* Footer row */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        {/* Assignees + priority + tags */}
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {effectiveAssignees.length > 0 ? (
            <div className="flex -space-x-1">
              {effectiveAssignees.slice(0, 3).map((a) => (
                <TooltipProvider key={a.userId} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold border border-card",
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
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-card bg-secondary text-[9px] font-medium text-muted-foreground">
                  +{effectiveAssignees.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground">?</div>
          )}
          {task.priority && (
            <span className={`rounded-pill px-1.5 py-0.5 text-[10px] font-medium capitalize ${PRIORITY_BADGE[task.priority] ?? ""}`}>
              {task.priority}
            </span>
          )}
          {task.tags && task.tags.slice(0, 2).map((tag) => (
            <span key={tag} className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-medium capitalize", TAG_COLORS[tag] ?? "bg-secondary text-muted-foreground border-border")}>
              {tag}
            </span>
          ))}
          {task.tags && task.tags.length > 2 && (
            <span className="text-[9px] text-muted-foreground/60">+{task.tags.length - 2}</span>
          )}
        </div>

        {/* Stats + due date */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
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
            <span className={cn("flex items-center gap-0.5", isOverdue ? "text-danger font-medium" : "")}>
              <Clock size={10} /> {formatDueShort(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sortable Column ───────────────────────────────────────────────────────────

function SortableColumn({
  column,
  tasks,
  currentUserId,
  onAddTask,
  onEditColumn,
  onDeleteColumn,
  onTaskClick,
  onDeleteTask,
  onMoveToProject,
  isDragOverlay,
}: {
  column: BoardColumn;
  tasks: TaskListItem[];
  currentUserId: string;
  onAddTask: (col: BoardColumn) => void;
  onEditColumn: (col: BoardColumn) => void;
  onDeleteColumn: (col: BoardColumn) => void;
  onTaskClick: (task: TaskListItem) => void;
  onDeleteTask: (task: TaskListItem) => void;
  onMoveToProject: (task: TaskListItem) => void;
  isDragOverlay?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: "column", column } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? {} : style}
      className={cn(
        "flex w-72 shrink-0 flex-col h-full",
        isDragOverlay && "rotate-1 opacity-90",
      )}
    >
      {/* Column header */}
      <div
        className="group/header flex items-center gap-2 pb-3 cursor-grab active:cursor-grabbing"
        {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
      >
        {/* Colored left-border accent */}
        <div
          className="h-5 w-0.75 shrink-0 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <span className="font-display text-[13px] font-semibold text-foreground tracking-tight leading-none">
          {column.name}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          {tasks.length}
        </span>
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTask(column);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Add Task"
                >
                  <Plus size={13} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Add Task</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              aria-label="Column options"
            >
              <MoreHorizontal size={13} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-7 z-20 min-w-36 rounded-card border border-border bg-card shadow-cf-2 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      onEditColumn(column);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <Pencil size={13} /> Edit Column
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteColumn(column);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} /> Delete Column
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="scrollbar-thin flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              currentUserId={currentUserId}
              onClick={() => onTaskClick(task)}
              onDelete={onDeleteTask}
              onMoveToProject={onMoveToProject}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="rounded-card border border-dashed px-4 py-6 text-center text-xs text-muted-foreground/60 border-cf-neutral-950!">
            No tasks yet
          </div>
        )}
      </div>

      {/* Add item footer */}
      <button
        type="button"
        onClick={() => onAddTask(column)}
        className="mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
      >
        <Plus size={12} /> Add Task
      </button>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

type MemberOption = { userId: string; name: string; email: string };

function TaskListView({
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

  const { data: teamData } = useQuery({
    queryKey: ["team-task-list"],
    queryFn: () =>
      http<{ members: MemberOption[] }>("/api/team").then((r) => ({
        members: r.members ?? [],
      })),
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

// ─── Page Props ────────────────────────────────────────────────────────────────


type TasksPageProps = {
  initialData?: TaskListResponse;
  initialColumns?: BoardColumnsResponse;
  currentUserId: string;
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TasksPage = ({
  initialData,
  initialColumns,
  currentUserId,
}: TasksPageProps) => {
  const dndId = useId();
  const [localColumns, setLocalColumns] = useState<BoardColumn[]>(
    initialColumns?.columns ?? [],
  );
  const [localTasks, setLocalTasks] = useState<TaskListItem[]>(
    initialData?.tasks ?? [],
  );
  const [search, setSearch] = useState("");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [filters, setFilters] = useState<ExtendedFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createColumnOpen, setCreateColumnOpen] = useState(false);
  const [editColumn, setEditColumn] = useState<BoardColumn | null>(null);
  const [createForColumn, setCreateForColumn] = useState<BoardColumn | null>(
    null,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"task" | "column" | null>(null);
  const dragStartColumnId = useRef<string | null>(null);
  const [view, setView] = useQueryState("view", {
    defaultValue: "board" as "board" | "list" | "calendar",
    parse: (v) => (v === "list" ? "list" : v === "calendar" ? "calendar" : "board"),
    serialize: (v) => v,
  });
  const [selectedTaskRef, setSelectedTaskRef] = useQueryState("task");
  const [deleteTask, setDeleteTask] = useState<TaskListItem | null>(null);
  const [deleteColumn, setDeleteColumn] = useState<BoardColumn | null>(null);
  const [moveTask, setMoveTask] = useState<TaskListItem | null>(null);

  // Resolve URL ref (refNumber or db id) → actual db id for the detail sheet
  const selectedTaskId = selectedTaskRef
    ? (localTasks.find(
        (t) => t.refNumber === selectedTaskRef || t.id === selectedTaskRef,
      )?.id ?? selectedTaskRef)
    : null;

  const { data: columnsData } = useBoardColumns(initialColumns);
  const { data: tasksData } = useTasks({ pageSize: 200 }, initialData);

  const moveTaskMutation = useMoveTask();
  const reorderTasksMutation = useReorderTasks();
  const reorderColumnsMutation = useReorderColumns();
  const deleteColumnMutation = useDeleteColumn();
  const deleteTaskMutation = useDeleteTask();

  // Sync remote data into local state
  useEffect(() => {
    if (columnsData?.columns) {
      setLocalColumns(columnsData.columns);
    }
  }, [columnsData]);

  useEffect(() => {
    if (tasksData?.tasks) {
      setLocalTasks(tasksData.tasks);
    }
  }, [tasksData]);

  // ─── DnD ────────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const { id, data } = event.active;
    setActiveId(String(id));
    setActiveType(data.current?.type ?? null);
    if (data.current?.type === "task") {
      const task = data.current.task as TaskListItem;
      dragStartColumnId.current =
        task.columnId ?? getTaskColumnId(task, localColumns);
    } else {
      dragStartColumnId.current = null;
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    if (activeData?.type !== "task") return;

    const overData = over.data.current;
    const activeTask = activeData.task as TaskListItem;

    // Determine which column we're over
    let targetColumnId: string | null = null;

    if (overData?.type === "column") {
      targetColumnId = String(over.id);
    } else if (overData?.type === "task") {
      const overTask = overData.task as TaskListItem;
      // Find what column the over task belongs to
      targetColumnId = getTaskColumnId(overTask, localColumns);
    }

    if (targetColumnId === null) return;

    const currentColumnId = getTaskColumnId(activeTask, localColumns);
    if (currentColumnId === targetColumnId) return;

    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === activeTask.id ? { ...t, columnId: targetColumnId } : t,
      ),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === "task") {
      const activeTask = activeData.task as TaskListItem;
      const currentTask = localTasks.find((t) => t.id === activeTask.id);
      if (!currentTask) return;

      let targetColumnId: string | null = null;

      if (overData?.type === "column") {
        targetColumnId = String(over.id);
      } else if (overData?.type === "task") {
        const overTask = overData.task as TaskListItem;
        targetColumnId = getTaskColumnId(overTask, localColumns);
      }

      if (
        targetColumnId !== null &&
        targetColumnId !== dragStartColumnId.current
      ) {
        // Cross-column move - persist to backend
        moveTaskMutation.mutate({
          taskId: activeTask.id,
          columnId: targetColumnId,
        });
      } else if (
        overData?.type === "task" &&
        String(active.id) !== String(over.id)
      ) {
        // Same-column reorder - commit new order locally and persist to backend
        const reorderColumnId = dragStartColumnId.current;
        setLocalTasks((prev) => {
          const oldIndex = prev.findIndex((t) => t.id === String(active.id));
          const newIndex = prev.findIndex((t) => t.id === String(over.id));
          if (oldIndex === -1 || newIndex === -1) return prev;
          const next = arrayMove(prev, oldIndex, newIndex);

          // Persist the new in-column order. Only tasks with a real columnId
          // (not the synthetic status fallback) can be reordered.
          if (reorderColumnId) {
            const orderedIds = next
              .filter((t) => t.columnId === reorderColumnId)
              .map((t) => t.id);
            if (orderedIds.length > 0) {
              reorderTasksMutation.mutate({
                columnId: reorderColumnId,
                orderedIds,
              });
            }
          }
          return next;
        });
      }
      dragStartColumnId.current = null;
    } else if (activeData?.type === "column") {
      if (String(active.id) !== String(over.id)) {
        setLocalColumns((prev) => {
          const oldIndex = prev.findIndex((c) => c.id === String(active.id));
          const newIndex = prev.findIndex((c) => c.id === String(over.id));
          if (oldIndex === -1 || newIndex === -1) return prev;
          const reordered = arrayMove(prev, oldIndex, newIndex);
          reorderColumnsMutation.mutate({
            orderedIds: reordered.map((c) => c.id),
          });
          return reordered;
        });
      }
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function getTaskColumnId(
    task: TaskListItem,
    columns: BoardColumn[],
  ): string | null {
    if (task.columnId) return task.columnId;
    // fallback: map task status to column type
    const matched = columns.find((c) =>
      statusMatchesColumnType(task.status, c.columnType),
    );
    return matched?.id ?? null;
  }

  function getTasksForColumn(columnId: string): TaskListItem[] {
    return filteredTasks.filter((t) => {
      if (t.columnId === columnId) return true;
      const col = localColumns.find((c) => c.id === columnId);
      if (!col || t.columnId) return false;
      return statusMatchesColumnType(t.status, col.columnType);
    });
  }

  // ─── Filtering ──────────────────────────────────────────────────────────────

  const filteredTasks = localTasks.filter((task) => {
    if (
      search &&
      !task.title.toLowerCase().includes(search.toLowerCase()) &&
      !(task.projectName ?? "").toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (assignedToMe) {
      const assigneeIds = (task.assignees ?? []).map((a) => a.userId);
      const isAssigned =
        task.assigneeUserId === currentUserId || assigneeIds.includes(currentUserId);
      if (!isAssigned) return false;
    }
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.projectId && task.projectId !== filters.projectId) return false;

    if (filters.assigneeUserIds?.length) {
      const assigneeIds = [
        ...(task.assignees ?? []).map((a) => a.userId),
        ...(task.assigneeUserId ? [task.assigneeUserId] : []),
      ];
      const hasMatch = filters.assigneeUserIds.some((id) => assigneeIds.includes(id));
      if (!hasMatch) return false;
    }

    if (filters.statuses?.length) {
      if (!filters.statuses.includes(task.status)) return false;
    }

    if (filters.dueDateRange?.from || filters.dueDateRange?.to) {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      if (filters.dueDateRange.from && due < filters.dueDateRange.from) return false;
      if (filters.dueDateRange.to && due > filters.dueDateRange.to) return false;
    }

    if (filters.tags?.length) {
      const taskTags = task.tags ?? [];
      const hasMatch = filters.tags.some((t) => taskTags.includes(t));
      if (!hasMatch) return false;
    }

    return true;
  });

  // ─── Active dragged item ─────────────────────────────────────────────────────

  const activeTask =
    activeType === "task"
      ? (localTasks.find((t) => t.id === activeId) ?? null)
      : null;
  const activeColumn =
    activeType === "column"
      ? (localColumns.find((c) => c.id === activeId) ?? null)
      : null;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleAddTask(col: BoardColumn) {
    setCreateForColumn(col);
    setCreateDialogOpen(true);
  }

  function handleEditColumn(col: BoardColumn) {
    setEditColumn(col);
  }

  function handleDeleteColumn(col: BoardColumn) {
    setDeleteColumn(col);
  }

  function handleDeleteTask(task: TaskListItem) {
    setDeleteTask(task);
  }

  function handleMoveToProject(task: TaskListItem) {
    setMoveTask(task);
  }

  const isLoading = !columnsData && !tasksData;

  return (
    <ListPageLayout
      title="My Tasks"
      description={`${localColumns.length} columns · ${localTasks.length} tasks`}
    >
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-48 max-w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() => setAssignedToMe((v) => !v)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs transition-colors cursor-pointer bg-white",
              assignedToMe
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            <UserCheck size={13} />
            Assigned to me
          </button>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs transition-colors cursor-pointer bg-white",
              filters.priority || filters.projectId || (filters.assigneeUserIds?.length ?? 0) > 0 || (filters.statuses?.length ?? 0) > 0 || !!(filters.dueDateRange?.from || filters.dueDateRange?.to) || (filters.tags?.length ?? 0) > 0
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            <SlidersHorizontal size={13} />
            Filters
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* New Task (list + calendar views) */}
          {view !== "board" && (
            <button
              type="button"
              onClick={() => {
                setCreateForColumn(null);
                setCreateDialogOpen(true);
              }}
              className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Plus size={13} />
              New Task
            </button>
          )}

          {/* View toggle */}
          <div className="flex h-8 items-center rounded-md border border-border bg-card p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded transition-colors cursor-pointer",
                view === "board"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Board view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded transition-colors cursor-pointer",
                view === "list"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="List view"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded transition-colors cursor-pointer",
                view === "calendar"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Calendar view"
            >
              <CalendarRange size={14} />
            </button>
          </div>
        </div>

        {/* Board / List */}
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-72 shrink-0 space-y-2">
                <Skeleton className="h-10 w-full rounded-card" />
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-24 w-full rounded-card" />
                ))}
              </div>
            ))}
          </div>
        ) : view === "list" ? (
          <div
            className="scrollbar-thin overflow-y-auto"
            style={{ height: "calc(100vh - 15rem)" }}
          >
            <TaskListView
              tasks={filteredTasks}
              currentUserId={currentUserId}
              onTaskClick={(task) =>
                setSelectedTaskRef(task.refNumber ?? task.id)
              }
              onDeleteTask={handleDeleteTask}
              onMoveToProject={handleMoveToProject}
            />
          </div>
        ) : view === "calendar" ? (
          <div
            className="scrollbar-thin overflow-y-auto"
            style={{ height: "calc(100vh - 15rem)" }}
          >
            <TaskCalendarView
              tasks={filteredTasks}
              onTaskClick={(task) =>
                setSelectedTaskRef(task.refNumber ?? task.id)
              }
            />
          </div>
        ) : (
          <DndContext
            id={dndId}
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              className="scrollbar-thin flex gap-5 overflow-x-auto pb-4"
              style={{ height: "calc(100vh - 15rem)" }}
            >
              <SortableContext
                items={localColumns.map((c) => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                {localColumns.map((col) => (
                  <SortableColumn
                    key={col.id}
                    column={col}
                    tasks={getTasksForColumn(col.id)}
                    currentUserId={currentUserId}
                    onAddTask={handleAddTask}
                    onEditColumn={handleEditColumn}
                    onDeleteColumn={handleDeleteColumn}
                    onTaskClick={(task) =>
                      setSelectedTaskRef(task.refNumber ?? task.id)
                    }
                    onDeleteTask={handleDeleteTask}
                    onMoveToProject={handleMoveToProject}
                  />
                ))}
              </SortableContext>

              {/* Add column button */}
              <button
                type="button"
                onClick={() => setCreateColumnOpen(true)}
                className="self-start flex h-fit w-72 shrink-0 items-center justify-center gap-2 rounded-card border-2 border-dashed border-border py-6 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Add Column
              </button>
            </div>

            <DragOverlay>
              {activeTask && (
                <SortableTaskCard
                  task={activeTask}
                  currentUserId={currentUserId}
                  onClick={() => {}}
                  onDelete={() => {}}
                  onMoveToProject={() => {}}
                  isDragOverlay
                />
              )}
              {activeColumn && (
                <SortableColumn
                  column={activeColumn}
                  tasks={getTasksForColumn(activeColumn.id)}
                  currentUserId={currentUserId}
                  onAddTask={() => {}}
                  onEditColumn={() => {}}
                  onDeleteColumn={() => {}}
                  onTaskClick={() => {}}
                  onDeleteTask={() => {}}
                  onMoveToProject={() => {}}
                  isDragOverlay
                />
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Dialogs / Drawers */}
        <EditColumnDialog
          open={createColumnOpen}
          onClose={() => setCreateColumnOpen(false)}
          mode="create"
        />

        <EditColumnDialog
          open={!!editColumn}
          onClose={() => setEditColumn(null)}
          mode="edit"
          column={editColumn ?? undefined}
        />

        <CreateTaskDialog
          open={createDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false);
            setCreateForColumn(null);
          }}
          defaultColumnId={createForColumn?.id}
          defaultColumnName={createForColumn?.name}
          defaultColumnColor={createForColumn?.color}
        />

        <FiltersDrawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          onChange={setFilters}
        />

        <TaskDetailSheet
          taskId={selectedTaskId}
          onClose={() => {
            setSelectedTaskRef(null);
            setView(null);
          }}
          currentUserId={currentUserId}
        />

        <DeleteTaskDialog
          open={!!deleteTask}
          taskTitle={deleteTask?.title ?? ""}
          isPending={deleteTaskMutation.isPending}
          onClose={() => setDeleteTask(null)}
          onConfirm={() => {
            if (!deleteTask) return;
            deleteTaskMutation.mutate(
              { taskId: deleteTask.id },
              { onSuccess: () => setDeleteTask(null) },
            );
          }}
        />

        <DeleteColumnDialog
          open={!!deleteColumn}
          columnName={deleteColumn?.name ?? ""}
          isPending={deleteColumnMutation.isPending}
          onClose={() => setDeleteColumn(null)}
          onConfirm={() => {
            if (!deleteColumn) return;
            deleteColumnMutation.mutate(
              { columnId: deleteColumn.id },
              { onSuccess: () => setDeleteColumn(null) },
            );
          }}
        />

        <MoveToProjectDialog
          open={!!moveTask}
          task={moveTask}
          onClose={() => setMoveTask(null)}
        />
      </div>
    </ListPageLayout>
  );
};

export default TasksPage;
