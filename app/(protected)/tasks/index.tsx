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
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks, useMoveTask, useReorderTasks, useDeleteTask } from "@/core/tasks/useCase";
import { useBoardColumns, useDeleteColumn, useReorderColumns } from "@/core/task-columns/useCase";
import type { TaskListItem, TaskListResponse } from "@/core/tasks/entity";
import type { BoardColumn, BoardColumnsResponse } from "@/core/task-columns/entity";
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
import { SortableTaskCard } from "@/components/tasks/board/SortableTaskCard";
import { SortableColumn } from "@/components/tasks/board/SortableColumn";
import { TaskListView } from "@/components/tasks/board/TaskListView";
import { statusMatchesColumnType } from "@/components/tasks/board/helpers";
import {
  Search,
  Plus,
  SlidersHorizontal,
  UserCheck,
  LayoutGrid,
  List,
  CalendarRange,
} from "lucide-react";

// ─── Page Props ────────────────────────────────────────────────────────────────

type TasksPageProps = {
  initialData?: TaskListResponse;
  initialColumns?: BoardColumnsResponse;
  currentUserId: string;
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TasksPage = ({ initialData, initialColumns, currentUserId }: TasksPageProps) => {
  const dndId = useId();
  const [localColumns, setLocalColumns] = useState<BoardColumn[]>(initialColumns?.columns ?? []);
  const [localTasks, setLocalTasks] = useState<TaskListItem[]>(initialData?.tasks ?? []);
  const [search, setSearch] = useState("");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [filters, setFilters] = useState<ExtendedFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createColumnOpen, setCreateColumnOpen] = useState(false);
  const [editColumn, setEditColumn] = useState<BoardColumn | null>(null);
  const [createForColumn, setCreateForColumn] = useState<BoardColumn | null>(null);
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
    ? (localTasks.find((t) => t.refNumber === selectedTaskRef || t.id === selectedTaskRef)?.id ??
      selectedTaskRef)
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(event: DragStartEvent) {
    const { id, data } = event.active;
    setActiveId(String(id));
    setActiveType(data.current?.type ?? null);
    if (data.current?.type === "task") {
      const task = data.current.task as TaskListItem;
      dragStartColumnId.current = task.columnId ?? getTaskColumnId(task, localColumns);
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
      prev.map((t) => (t.id === activeTask.id ? { ...t, columnId: targetColumnId } : t)),
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

      if (targetColumnId !== null && targetColumnId !== dragStartColumnId.current) {
        // Cross-column move - persist to backend
        moveTaskMutation.mutate({
          taskId: activeTask.id,
          columnId: targetColumnId,
        });
      } else if (overData?.type === "task" && String(active.id) !== String(over.id)) {
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
            const orderedIds = next.filter((t) => t.columnId === reorderColumnId).map((t) => t.id);
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

  function getTaskColumnId(task: TaskListItem, columns: BoardColumn[]): string | null {
    if (task.columnId) return task.columnId;
    // fallback: map task status to column type
    const matched = columns.find((c) => statusMatchesColumnType(task.status, c.columnType));
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
    activeType === "task" ? (localTasks.find((t) => t.id === activeId) ?? null) : null;
  const activeColumn =
    activeType === "column" ? (localColumns.find((c) => c.id === activeId) ?? null) : null;

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
      <div className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative max-w-64 min-w-48 flex-1">
            <Search
              size={14}
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 bg-white pl-9 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setAssignedToMe((v) => !v)}
            className={cn(
              "flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-white px-3 text-xs transition-colors",
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
              "flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-white px-3 text-xs transition-colors",
              filters.priority ||
                filters.projectId ||
                (filters.assigneeUserIds?.length ?? 0) > 0 ||
                (filters.statuses?.length ?? 0) > 0 ||
                !!(filters.dueDateRange?.from || filters.dueDateRange?.to) ||
                (filters.tags?.length ?? 0) > 0
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors"
            >
              <Plus size={13} />
              New Task
            </button>
          )}

          {/* View toggle */}
          <div className="border-border bg-card flex h-8 items-center gap-0.5 rounded-md border p-0.5">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors",
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
                "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors",
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
                "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors",
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
                <Skeleton className="rounded-card h-10 w-full" />
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="rounded-card h-24 w-full" />
                ))}
              </div>
            ))}
          </div>
        ) : view === "list" ? (
          <div className="scrollbar-thin overflow-y-auto" style={{ height: "calc(100vh - 15rem)" }}>
            <TaskListView
              tasks={filteredTasks}
              currentUserId={currentUserId}
              onTaskClick={(task) => setSelectedTaskRef(task.refNumber ?? task.id)}
              onDeleteTask={handleDeleteTask}
              onMoveToProject={handleMoveToProject}
            />
          </div>
        ) : view === "calendar" ? (
          <div className="scrollbar-thin overflow-y-auto" style={{ height: "calc(100vh - 15rem)" }}>
            <TaskCalendarView
              tasks={filteredTasks}
              onTaskClick={(task) => setSelectedTaskRef(task.refNumber ?? task.id)}
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
                    onTaskClick={(task) => setSelectedTaskRef(task.refNumber ?? task.id)}
                    onDeleteTask={handleDeleteTask}
                    onMoveToProject={handleMoveToProject}
                  />
                ))}
              </SortableContext>

              {/* Add column button */}
              <button
                type="button"
                onClick={() => setCreateColumnOpen(true)}
                className="rounded-card border-border text-muted-foreground hover:border-foreground hover:text-foreground flex h-fit w-72 shrink-0 cursor-pointer items-center justify-center gap-2 self-start border-2 border-dashed py-6 text-sm transition-colors"
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

        <MoveToProjectDialog open={!!moveTask} task={moveTask} onClose={() => setMoveTask(null)} />
      </div>
    </ListPageLayout>
  );
};

export default TasksPage;
