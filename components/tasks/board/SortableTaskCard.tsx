"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getInitials } from "@/utils/user";
import { formatDueShort, PRIORITY_BADGE } from "@/core/tasks/entity";
import type { TaskListItem } from "@/core/tasks/entity";
import { TAG_COLORS } from "./constants";
import {
  MoreHorizontal,
  FolderInput,
  Trash2,
  MessageSquare,
  Paperclip,
  Clock,
} from "lucide-react";

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
