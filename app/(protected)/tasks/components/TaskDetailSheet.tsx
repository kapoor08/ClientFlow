"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { TiptapEditor } from "@/components/TiptapEditor";
import {
  useTaskDetail,
  useTaskComments,
  useTaskActivity,
  useCreateComment,
  useSubtasks,
  useCreateSubtask,
  useToggleSubtask,
  useDeleteSubtask,
  useTaskAttachments,
  useUploadAttachment,
  useDeleteAttachment,
} from "@/core/task-detail/useCase";
import { useUpdateTask } from "@/core/tasks/useCase";
import { useBoardColumns } from "@/core/task-columns/useCase";
import { http } from "@/core/infrastructure";
import { formatActivityMessage } from "@/core/task-detail/entity";
import { getInitials, PRIORITY_BADGE } from "@/core/tasks/entity";
import {
  X,
  CalendarDays,
  ChevronDown,
  User,
  Clock,
  Folder,
  Flag,
  Send,
  AlertCircle,
  CheckSquare,
  Square,
  Plus,
  Paperclip,
  Trash2,
  FileText,
  Upload,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type MemberOption = { userId: string; name: string; email: string };

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent", color: "#ef4444" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "low", label: "Low", color: "#71717a" },
];

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", color: "#3b82f6" },
  { value: "in_progress", label: "In Progress", color: "#f59e0b" },
  { value: "review", label: "Review", color: "#8b5cf6" },
  { value: "blocked", label: "Blocked", color: "#ef4444" },
  { value: "done", label: "Done", color: "#10b981" },
];

// ─── Relative time helper ──────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Inline editable title ────────────────────────────────────────────────────

function InlineTitle({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="w-full rounded bg-transparent text-xl font-semibold text-foreground outline-none ring-2 ring-primary/40 px-1 -mx-1"
      />
    );
  }

  return (
    <h2
      className="cursor-text text-xl font-semibold text-foreground leading-snug hover:bg-secondary/60 rounded px-1 -mx-1 transition-colors"
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value}
    </h2>
  );
}

// ─── Property row ──────────────────────────────────────────────────────────────

function PropRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

type TaskDetailSheetProps = {
  taskId: string | null;
  onClose: () => void;
};

export function TaskDetailSheet({ taskId, onClose }: TaskDetailSheetProps) {
  const [commentHtml, setCommentHtml] = useState("");
  const [commentKey, setCommentKey] = useState(0);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: taskData, isLoading: taskLoading } = useTaskDetail(taskId);
  const { data: commentsData } = useTaskComments(taskId);
  const { data: activityData } = useTaskActivity(taskId);
  const { data: columnsData } = useBoardColumns();
  const { data: subtasksData } = useSubtasks(taskId);
  const { data: attachmentsData } = useTaskAttachments(taskId);

  const updateTask = useUpdateTask();
  const createComment = useCreateComment(taskId ?? "");
  const createSubtask = useCreateSubtask(taskId ?? "");
  const toggleSubtask = useToggleSubtask(taskId ?? "");
  const deleteSubtaskMutation = useDeleteSubtask(taskId ?? "");
  const uploadAttachment = useUploadAttachment(taskId ?? "");
  const deleteAttachmentMutation = useDeleteAttachment(taskId ?? "");

  const { data: teamData } = useQuery({
    queryKey: ["team-task-detail"],
    queryFn: () =>
      http<{ members: MemberOption[] }>("/api/team").then((r) => ({
        members: r.members ?? [],
      })),
    enabled: !!taskId,
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

  const columns = columnsData?.columns ?? [];
  const task = taskData;
  const comments = commentsData?.comments ?? [];
  const activity = activityData?.activity ?? [];
  const subtasks = subtasksData?.subtasks ?? [];
  const attachments = attachmentsData?.attachments ?? [];

  const subtasksDone = subtasks.filter((s) => s.status === "done").length;

  // ─── Save helpers ──────────────────────────────────────────────────────────

  function saveField(
    field: string,
    value: string | null | undefined,
    extra?: Record<string, unknown>,
  ) {
    if (!task) return;
    updateTask.mutate(
      {
        taskId: task.id,
        data: {
          projectId: task.projectId,
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority ?? null,
          assigneeUserId: task.assigneeUserId ?? null,
          dueDate: task.dueDate ?? null,
          estimateMinutes: task.estimateMinutes ?? null,
          columnId: task.columnId ?? null,
          [field]: value ?? null,
          ...extra,
        },
      },
      {
        onError: (err) => toast.error(err.message ?? "Failed to update task."),
      },
    );
  }

  const isCommentEmpty = !commentHtml || commentHtml === "<p></p>" || commentHtml.trim() === "";

  function handleSubmitComment(e?: React.FormEvent) {
    e?.preventDefault();
    if (isCommentEmpty) return;

    createComment.mutate(commentHtml, {
      onSuccess: () => {
        setCommentHtml("");
        setCommentKey((k) => k + 1);
      },
      onError: (err) => toast.error(err.message ?? "Failed to post comment."),
    });
  }

  const selectedPriority = PRIORITY_OPTIONS.find(
    (p) => p.value === task?.priority,
  );

  const assigneeInitials = task?.assigneeName
    ? getInitials(task.assigneeName)
    : null;

  // Merge comments + activity for the right sidebar feed
  const feed = [
    ...comments.map((c) => ({
      id: c.id,
      type: "comment" as const,
      actorName: c.authorName,
      createdAt: c.createdAt,
      body: c.body,
      action: null as string | null,
      oldValues: null as Record<string, unknown> | null,
      newValues: null as Record<string, unknown> | null,
    })),
    ...activity
      .filter((a) => a.action !== "comment.added")
      .map((a) => ({
        id: a.id,
        type: "activity" as const,
        actorName: a.actorName,
        createdAt: a.createdAt,
        body: null as string | null,
        action: a.action,
        oldValues: a.oldValues,
        newValues: a.newValues,
      })),
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <Dialog open={!!taskId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex h-[90vh] w-[90vw] max-w-275! flex-col p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{task?.title ?? "Task detail"}</DialogTitle>

        {/* ── Modal header bar ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
            <Folder size={11} className="shrink-0" />
            <span className="truncate">{task?.projectName ?? "—"}</span>
            {task?.columnName && (
              <>
                <span className="text-border">/</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: task.columnColor ?? "#3b82f6" }}
                >
                  {task.columnName}
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {taskLoading || !task ? (
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* ─── Left pane ──────────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col overflow-y-auto border-r border-border p-6">
              {/* Title */}
              <DialogHeader className="mb-5">
                <InlineTitle
                  value={task.title}
                  onSave={(v) => saveField("title", v)}
                />
              </DialogHeader>

              {/* Properties — 2-column grid */}
              <div className="mb-5 rounded-card border border-border overflow-hidden text-sm">

                {/* Status — full width */}
                <div className="flex items-center gap-4 border-b border-border px-4 py-2.5 bg-secondary/10">
                  <div className="flex w-20 shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <AlertCircle size={11} /> Status
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => saveField("status", opt.value)}
                        className={cn(
                          "rounded-pill px-2.5 py-0.5 text-[11px] font-medium transition-all",
                          task.status === opt.value
                            ? "text-white shadow-sm"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80",
                        )}
                        style={task.status === opt.value ? { backgroundColor: opt.color } : {}}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2-column grid */}
                <div className="grid grid-cols-2">

                  {/* Column */}
                  <div className="flex flex-col gap-1 border-b border-r border-border px-4 py-2.5">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <AlertCircle size={10} /> Column
                    </span>
                    <Select
                      value={task.columnId ?? ""}
                      onValueChange={(v) => saveField("columnId", v || null)}
                    >
                      <SelectTrigger className="h-7 border-0 bg-transparent px-0 text-xs shadow-none focus:ring-0 -ml-0.5">
                        <SelectValue placeholder="No column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="flex flex-col gap-1 border-b border-border px-4 py-2.5">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Flag size={10} /> Priority
                    </span>
                    <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="flex h-7 items-center gap-1.5 text-xs text-foreground hover:text-foreground transition-colors">
                          {selectedPriority ? (
                            <>
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedPriority.color }} />
                              <span className={`rounded-pill px-1.5 py-0.5 text-[10px] font-medium capitalize ${PRIORITY_BADGE[task.priority ?? ""] ?? ""}`}>
                                {selectedPriority.label}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">No priority</span>
                          )}
                          <ChevronDown size={11} className="text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-1" align="start">
                        <button type="button" onClick={() => { saveField("priority", null); setPriorityOpen(false); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary">
                          <span className="h-2 w-2 rounded-full border border-muted-foreground" /> None
                        </button>
                        {PRIORITY_OPTIONS.map((opt) => (
                          <button key={opt.value} type="button" onClick={() => { saveField("priority", opt.value); setPriorityOpen(false); }}
                            className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors", task.priority === opt.value ? "bg-secondary text-foreground font-medium" : "hover:bg-secondary/50 text-muted-foreground")}
                          >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: opt.color }} />
                            {opt.label}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Assignee */}
                  <div className="flex flex-col gap-1 border-b border-r border-border px-4 py-2.5">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <User size={10} /> Assignee
                    </span>
                    <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="flex h-7 items-center gap-1.5 text-xs hover:text-foreground transition-colors">
                          {task.assigneeUserId ? (
                            <>
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-primary">{assigneeInitials}</div>
                              <span className="text-foreground">{task.assigneeName}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                          <ChevronDown size={11} className="text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2" align="start">
                        <Input placeholder="Search members…" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="mb-2 h-7 text-xs" />
                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                          {task.assigneeUserId && (
                            <button type="button" onClick={() => { saveField("assigneeUserId", null); setAssigneeOpen(false); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary">
                              <User size={14} /> Unassign
                            </button>
                          )}
                          {filteredMembers.map((m) => (
                            <button key={m.userId} type="button" onClick={() => { saveField("assigneeUserId", m.userId); setAssigneeOpen(false); setMemberSearch(""); }}
                              className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors", task.assigneeUserId === m.userId ? "bg-secondary text-foreground font-medium" : "hover:bg-secondary/50 text-muted-foreground")}
                            >
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-primary">{getInitials(m.name)}</div>
                              <div className="min-w-0">
                                <p className="truncate text-foreground">{m.name}</p>
                                <p className="truncate text-muted-foreground">{m.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Due date */}
                  <div className="flex flex-col gap-1 border-b border-border px-4 py-2.5">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <CalendarDays size={10} /> Due date
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateTask.mutate({ taskId: task.id, data: { projectId: task.projectId, title: task.title, description: task.description ?? "", status: task.status, priority: task.priority ?? null, assigneeUserId: task.assigneeUserId ?? null, dueDate: val ? new Date(val).toISOString() : null, estimateMinutes: task.estimateMinutes ?? null, columnId: task.columnId ?? null } });
                        }}
                        className="h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {task.dueDate && (
                        <button type="button" onClick={() => { updateTask.mutate({ taskId: task.id, data: { projectId: task.projectId, title: task.title, description: task.description ?? "", status: task.status, priority: task.priority ?? null, assigneeUserId: task.assigneeUserId ?? null, dueDate: null, estimateMinutes: task.estimateMinutes ?? null, columnId: task.columnId ?? null } }); }} className="text-muted-foreground hover:text-foreground">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Estimate */}
                  <div className="flex flex-col gap-1 border-r border-border px-4 py-2.5">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Clock size={10} /> Estimate
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 30"
                        defaultValue={task.estimateMinutes ?? ""}
                        onBlur={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : null;
                          updateTask.mutate({ taskId: task.id, data: { projectId: task.projectId, title: task.title, description: task.description ?? "", status: task.status, priority: task.priority ?? null, assigneeUserId: task.assigneeUserId ?? null, dueDate: task.dueDate ?? null, estimateMinutes: val, columnId: task.columnId ?? null } });
                        }}
                        className="h-7 w-24 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                  </div>

                  {/* Reporter */}
                  <div className="flex flex-col gap-1 px-4 py-2.5">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <User size={10} /> Reporter
                    </span>
                    <span className="text-xs text-foreground">
                      {task.reporterName ?? "—"}
                    </span>
                  </div>

                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <p className="mb-2 text-sm font-medium text-foreground">
                  Description
                </p>
                <div className="rounded-card border border-border overflow-hidden">
                  <TiptapEditor
                    key={task.id}
                    content={task.description ?? ""}
                    placeholder="Add a description…"
                    members={allMembers.map((m) => ({
                      id: m.userId,
                      name: m.name,
                    }))}
                    onBlur={(html) => {
                      const normalized =
                        html === "<p></p>" ? "" : html;
                      if (normalized !== (task.description ?? "")) {
                        updateTask.mutate(
                          {
                            taskId: task.id,
                            data: {
                              projectId: task.projectId,
                              title: task.title,
                              description: normalized,
                              status: task.status,
                              priority: task.priority ?? null,
                              assigneeUserId: task.assigneeUserId ?? null,
                              dueDate: task.dueDate ?? null,
                              estimateMinutes: task.estimateMinutes ?? null,
                              columnId: task.columnId ?? null,
                            },
                          },
                          {
                            onError: (err) =>
                              toast.error(
                                err.message ?? "Failed to save description.",
                              ),
                          },
                        );
                      }
                    }}
                  />
                </div>
              </div>

              {/* ─── Subtasks ─────────────────────────────────────────────── */}
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <CheckSquare size={13} />
                    Subtasks
                    {subtasks.length > 0 && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {subtasksDone}/{subtasks.length}
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddingSubtask(true)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>

                {/* Progress bar */}
                {subtasks.length > 0 && (
                  <div className="mb-2 h-1 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-success transition-all duration-300"
                      style={{
                        width: `${Math.round((subtasksDone / subtasks.length) * 100)}%`,
                      }}
                    />
                  </div>
                )}

                {/* Subtask list */}
                <div className="space-y-1">
                  {subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      className="group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-secondary/50 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleSubtask.mutate(sub.id, {
                            onError: (err) =>
                              toast.error(err.message ?? "Failed to update."),
                          })
                        }
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {sub.status === "done" ? (
                          <CheckSquare size={14} className="text-success" />
                        ) : (
                          <Square size={14} />
                        )}
                      </button>
                      <span
                        className={cn(
                          "flex-1 text-xs",
                          sub.status === "done"
                            ? "line-through text-muted-foreground"
                            : "text-foreground",
                        )}
                      >
                        {sub.title}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          deleteSubtaskMutation.mutate(sub.id, {
                            onError: (err) =>
                              toast.error(err.message ?? "Failed to delete."),
                          })
                        }
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Inline add subtask */}
                {addingSubtask && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const trimmed = newSubtask.trim();
                      if (!trimmed) return;
                      createSubtask.mutate(trimmed, {
                        onSuccess: () => {
                          setNewSubtask("");
                          setAddingSubtask(false);
                        },
                        onError: (err) =>
                          toast.error(err.message ?? "Failed to create subtask."),
                      });
                    }}
                    className="mt-2 flex items-center gap-2"
                  >
                    <Input
                      autoFocus
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Subtask title…"
                      className="h-7 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setAddingSubtask(false);
                          setNewSubtask("");
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={!newSubtask.trim() || createSubtask.isPending}
                    >
                      Add
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingSubtask(false);
                        setNewSubtask("");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X size={13} />
                    </button>
                  </form>
                )}
              </div>

              {/* ─── Attachments ──────────────────────────────────────────── */}
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Paperclip size={13} />
                    Attachments
                    {attachments.length > 0 && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {attachments.length}
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAttachment.isPending}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <Upload size={12} />
                    {uploadAttachment.isPending ? "Uploading…" : "Upload"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      uploadAttachment.mutate(
                        { file },
                        {
                          onError: (err) =>
                            toast.error(err.message ?? "Upload failed."),
                        },
                      );
                      e.target.value = "";
                    }}
                  />
                </div>

                {attachments.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    No attachments yet.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {attachments.map((att) => {
                    const isImage = att.mimeType?.startsWith("image/");
                    return (
                      <div
                        key={att.id}
                        className="group relative overflow-hidden rounded-card border border-border bg-secondary/20"
                      >
                        {isImage && att.storageUrl ? (
                          <a
                            href={att.storageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={att.storageUrl}
                              alt={att.fileName}
                              className="h-20 w-full object-cover"
                            />
                          </a>
                        ) : (
                          <a
                            href={att.storageUrl ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-20 items-center justify-center"
                          >
                            <FileText
                              size={28}
                              className="text-muted-foreground"
                            />
                          </a>
                        )}
                        <div className="px-2 py-1.5">
                          <p className="truncate text-[10px] text-foreground leading-tight">
                            {att.fileName}
                          </p>
                          {att.sizeBytes && (
                            <p className="text-[9px] text-muted-foreground">
                              {(att.sizeBytes / 1024).toFixed(0)} KB
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            deleteAttachmentMutation.mutate(att.id, {
                              onError: (err) =>
                                toast.error(
                                  err.message ?? "Failed to delete attachment.",
                                ),
                            })
                          }
                          className="absolute right-1 top-1 rounded bg-card/80 p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Meta */}
              <p className="mt-auto pt-2 text-[11px] text-muted-foreground">
                Created {relativeTime(task.createdAt)}
                {task.reporterName ? ` by ${task.reporterName}` : ""}
              </p>
            </div>

            {/* ─── Right pane ─────────────────────────────────────────────── */}
            <div className="flex w-96 shrink-0 flex-col overflow-hidden bg-secondary/20">
              <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Activity & Comments
                </p>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {feed.length > 0 ? `${feed.length} items` : ""}
                </span>
              </div>

              {/* Feed */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {feed.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    No activity yet.
                  </p>
                )}
                {feed.map((item) => (
                  <div key={item.id} className="flex gap-2.5">
                    {/* Avatar */}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-primary mt-0.5">
                      {getInitials(item.actorName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.type === "comment" ? (
                        <>
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-xs font-medium text-foreground">
                              {item.actorName ?? "Someone"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {relativeTime(item.createdAt)}
                            </span>
                          </div>
                          <div
                            className="rounded-card border border-border bg-card px-3 py-2 text-xs text-foreground prose prose-sm max-w-none [&_p]:my-0"
                            dangerouslySetInnerHTML={{ __html: item.body ?? "" }}
                          />
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {item.actorName ?? "Someone"}
                            </span>{" "}
                            {formatActivityMessage(
                              item.action ?? "",
                              item.oldValues,
                              item.newValues,
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            · {relativeTime(item.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              <div className="border-t border-border px-4 py-3">
                <div className="rounded-md border border-input bg-background overflow-hidden mb-2">
                  <TiptapEditor
                    key={commentKey}
                    content=""
                    minimal
                    members={allMembers.map((m) => ({ id: m.userId, name: m.name }))}
                    onChange={setCommentHtml}
                    placeholder="Write a comment… (type @ to mention)"
                    className="min-h-[72px] text-xs"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    ⌘ + Enter to post
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleSubmitComment()}
                    disabled={isCommentEmpty || createComment.isPending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitComment();
                    }}
                  >
                    <Send size={13} className="mr-1.5" />
                    {createComment.isPending ? "Posting…" : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
