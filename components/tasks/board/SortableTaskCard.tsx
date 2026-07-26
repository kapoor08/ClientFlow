"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/utils/cn";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getInitials } from "@/utils/user";
import { formatDueShort, PRIORITY_BADGE } from "@/core/tasks/entity";
import type { TaskListItem } from "@/core/tasks/entity";
import { TAG_COLORS } from "./constants";
import { MoreHorizontal, FolderInput, Trash2, MessageSquare, Paperclip, Clock } from "lucide-react";

export function SortableTaskCard({
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

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

  const isOverdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date();

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
        "group rounded-card border-border bg-card shadow-cf-1 cursor-pointer border border-l-[3px] px-3 py-2.5 transition-all select-none",
        task.priority ? priorityAccent[task.priority] : "border-l-border",
        isDragOverlay ? "shadow-cf-3 rotate-1" : "hover:shadow-cf-2 hover:border-border/80",
      )}
    >
      {/* Header: ref + menu */}
      <div className="mb-1 flex items-center justify-between gap-1">
        {task.refNumber && (
          <span className="text-muted-foreground/60 font-mono text-[10px] select-none">
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
            className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-5 w-5 cursor-pointer items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Task options"
          >
            <MoreHorizontal size={13} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="rounded-card border-border bg-card shadow-cf-2 absolute top-6 right-0 z-20 min-w-40 border py-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToProject(task);
                    setMenuOpen(false);
                  }}
                  className="text-foreground hover:bg-secondary flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors"
                >
                  <FolderInput size={13} /> Move to Project
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task);
                    setMenuOpen(false);
                  }}
                  className="text-danger hover:bg-danger/10 flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors"
                >
                  <Trash2 size={13} /> Delete Task
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-foreground line-clamp-2 text-sm leading-snug font-medium">{task.title}</p>

      {/* Project */}
      {task.projectName && (
        <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{task.projectName}</p>
      )}

      {/* Footer row */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        {/* Assignees + priority + tags */}
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {effectiveAssignees.length > 0 ? (
            <div className="flex -space-x-1">
              {effectiveAssignees.slice(0, 3).map((a) => (
                <TooltipProvider key={a.userId} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "border-card flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-semibold",
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
                <div className="border-card bg-secondary text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-medium">
                  +{effectiveAssignees.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="border-border text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full border border-dashed text-[10px]">
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
          {task.tags &&
            task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-full border px-1.5 py-0.5 text-[9px] font-medium capitalize",
                  TAG_COLORS[tag] ?? "bg-secondary text-muted-foreground border-border",
                )}
              >
                {tag}
              </span>
            ))}
          {task.tags && task.tags.length > 2 && (
            <span className="text-muted-foreground/60 text-[9px]">+{task.tags.length - 2}</span>
          )}
        </div>

        {/* Stats + due date */}
        <div className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-[10px]">
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
            <span
              className={cn(
                "flex items-center gap-0.5",
                isOverdue ? "text-danger font-medium" : "",
              )}
            >
              <Clock size={10} /> {formatDueShort(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
