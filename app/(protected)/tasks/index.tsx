"use client";

import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTasks, useMoveTask } from "@/core/tasks/useCase";
import { useBoardColumns, useDeleteColumn, useReorderColumns } from "@/core/task-columns/useCase";
import { getInitials, formatDueShort, PRIORITY_BADGE } from "@/core/tasks/entity";
import type { TaskListItem, TaskListResponse, TaskFilters } from "@/core/tasks/entity";
import type { BoardColumn, BoardColumnsResponse } from "@/core/task-columns/entity";
import { EditColumnDialog } from "./components/EditColumnDialog";
import { FiltersDrawer } from "./components/FiltersDrawer";
import { CreateTaskDialog } from "./components/CreateTaskDialog";
import { TaskDetailSheet } from "./components/TaskDetailSheet";
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

// ─── Sortable Task Card ────────────────────────────────────────────────────────

function SortableTaskCard({
  task,
  currentUserId,
  onClick,
  isDragOverlay,
}: {
  task: TaskListItem;
  currentUserId: string;
  onClick: () => void;
  isDragOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: "task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const initials = getInitials(task.assigneeName);
  const isOwner = task.assigneeUserId === currentUserId;

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? {} : style}
      {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
      onClick={onClick}
      className={cn(
        "group rounded-card border border-border bg-card px-3 py-2.5 shadow-cf-1 transition-all cursor-pointer select-none",
        isDragOverlay
          ? "rotate-1 shadow-cf-3"
          : "hover:shadow-cf-2 hover:border-border/80",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-medium text-foreground leading-snug flex-1 min-w-0">
          {task.title}
        </p>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground -mr-1"
          aria-label="Task options"
        >
          <MoreHorizontal size={13} />
        </button>
      </div>
      {task.projectName && (
        <p className="mt-0.5 text-xs text-muted-foreground truncate">
          {task.projectName}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {task.assigneeUserId ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                      isOwner
                        ? "bg-primary text-primary-foreground"
                        : "bg-brand-100 text-primary",
                    )}
                  >
                    {initials}
                  </div>
                </TooltipTrigger>
                <TooltipContent>{task.assigneeName}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground">
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

// ─── Sortable Column ───────────────────────────────────────────────────────────

function SortableColumn({
  column,
  tasks,
  currentUserId,
  onAddTask,
  onEditColumn,
  onDeleteColumn,
  onTaskClick,
  isDragOverlay,
}: {
  column: BoardColumn;
  tasks: TaskListItem[];
  currentUserId: string;
  onAddTask: (col: BoardColumn) => void;
  onEditColumn: (col: BoardColumn) => void;
  onDeleteColumn: (col: BoardColumn) => void;
  onTaskClick: (task: TaskListItem) => void;
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
        "flex w-72 shrink-0 flex-col",
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
          className="h-5 w-[3px] shrink-0 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <span className="font-display text-[13px] font-semibold text-foreground tracking-tight leading-none">
          {column.name}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          {tasks.length}
        </span>
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddTask(column); }}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Add task"
          >
            <Plus size={13} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
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
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <Pencil size={13} /> Edit Column
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteColumn(column);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-danger hover:bg-danger/10 transition-colors"
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
      <div className="flex-1 overflow-y-auto space-y-2 min-h-16">
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
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="rounded-card border border-dashed border-border/60 px-4 py-6 text-center text-xs text-muted-foreground/60">
            No tasks yet
          </div>
        )}
      </div>

      {/* Add item footer */}
      <button
        type="button"
        onClick={() => onAddTask(column)}
        className="mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
      >
        <Plus size={12} /> Add task
      </button>
    </div>
  );
}

// ─── Page Props ────────────────────────────────────────────────────────────────

type ExtendedFilters = TaskFilters & {
  projectId?: string;
  assigneeUserId?: string;
};

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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: columnsData } = useBoardColumns(initialColumns);
  const { data: tasksData } = useTasks({ pageSize: 200 }, initialData);

  const moveTaskMutation = useMoveTask();
  const reorderColumnsMutation = useReorderColumns();
  const deleteColumnMutation = useDeleteColumn();

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

      if (targetColumnId !== null && targetColumnId !== activeTask.columnId) {
        moveTaskMutation.mutate({ taskId: activeTask.id, columnId: targetColumnId });
      }
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
    if (assignedToMe && task.assigneeUserId !== currentUserId) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.projectId && task.projectId !== filters.projectId) return false;
    if (
      filters.assigneeUserId &&
      task.assigneeUserId !== filters.assigneeUserId
    ) {
      return false;
    }
    return true;
  });

  // ─── Active dragged item ─────────────────────────────────────────────────────

  const activeTask =
    activeType === "task"
      ? localTasks.find((t) => t.id === activeId) ?? null
      : null;
  const activeColumn =
    activeType === "column"
      ? localColumns.find((c) => c.id === activeId) ?? null
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
    if (
      !window.confirm(
        `Delete column "${col.name}"? Tasks in this column will be unassigned.`,
      )
    )
      return;
    deleteColumnMutation.mutate({ columnId: col.id });
  }

  const isLoading = !columnsData && !tasksData;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            My Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `${localColumns.length} columns · ${localTasks.length} tasks`}
          </p>
        </div>
      </div>

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
            className="pl-9 h-8 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => setAssignedToMe((v) => !v)}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs transition-colors",
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
            "flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs transition-colors",
            filters.priority || filters.projectId || filters.assigneeUserId
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
          )}
        >
          <SlidersHorizontal size={13} />
          Filters
        </button>
      </div>

      {/* Board */}
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
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div
            className="flex gap-5 overflow-x-auto pb-6"
            style={{ minHeight: "calc(100vh - 16rem)" }}
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
                  onTaskClick={(task) => setSelectedTaskId(task.id)}
                />
              ))}
            </SortableContext>

            {/* Add column button */}
            <button
              type="button"
              onClick={() => setCreateColumnOpen(true)}
              className="flex h-fit w-72 shrink-0 items-center justify-center gap-2 rounded-card border-2 border-dashed border-border py-6 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
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
                onTaskClick={() => { /* drag overlay */ }}
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
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
};

export default TasksPage;
