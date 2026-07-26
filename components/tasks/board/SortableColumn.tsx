"use client";

import { useState } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TaskListItem } from "@/core/tasks/entity";
import type { BoardColumn } from "@/core/task-columns/entity";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { SortableTaskCard } from "./SortableTaskCard";

export function SortableColumn({
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
