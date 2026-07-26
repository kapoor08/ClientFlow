"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTaskDetail,
  useTaskComments,
  useTaskActivity,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useSubtasks,
  useToggleSubtask,
  useDeleteSubtask,
  useTaskAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  taskDetailKeys,
} from "@/core/task-detail/useCase";
import { useUpdateTask, useDeleteTask, useUpdateTaskAssignees } from "@/core/tasks/useCase";
import { TimeEstimateInput } from "@/components/form";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { http } from "@/core/infrastructure";
import { formatActivityMessage } from "@/core/task-detail/entity";
import { PRIORITY_BADGE } from "@/core/tasks/entity";
import {
  TASK_PRIORITY_OPTIONS as PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS as STATUS_OPTIONS,
} from "@/constants/task";
import { formatDateDayMonthYear } from "@/utils/date";
import { getInitials } from "@/utils/user";
import { TASK_TAG_OPTIONS } from "@/schemas/tasks";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { DEFAULT_COLUMN_COLOR } from "@/constants/colors";
import { RelativeTime, EditedBadge } from "./task-detail/TimeBadges";
import { InlineTitle } from "./task-detail/InlineTitle";
import { CommentBody } from "./task-detail/CommentBody";
import { FileTypeThumbnail, FilePreviewModal } from "./task-detail/FilePreview";
import { TAG_COLORS } from "./task-detail/constants";
import type { MemberOption, PreviewFile } from "./task-detail/types";
import { LogTimeDialog } from "@/components/time-tracking/LogTimeDialog";
import { TimeEntriesList, timeEntriesKeys } from "@/components/time-tracking/TimeEntriesList";
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
  Upload,
  Tag,
  MoreHorizontal,
  Pencil,
  Check,
  Download,
  ZoomIn,
  Eye,
  File,
} from "lucide-react";

// Code-split the rich-text editor (6 tiptap packages): loaded only when a task
// detail is opened, not shipped in the tasks route bundle. ssr:false because
// the editor is browser-only (useEditor + portals).
const TiptapEditor = dynamic(
  () => import("@/components/ui/tiptap-editor").then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <Skeleton className="min-h-[80px] w-full rounded-md" /> },
);

// ─── Main Component ────────────────────────────────────────────────────────────

type TaskDetailSheetProps = {
  taskId: string | null;
  onClose: () => void;
  currentUserId?: string;
};

export function TaskDetailSheet({ taskId, onClose, currentUserId }: TaskDetailSheetProps) {
  const qc = useQueryClient();
  const [commentHtml, setCommentHtml] = useState("");
  const [commentKey, setCommentKey] = useState(0);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [pendingAttachPreviews, setPendingAttachPreviews] = useState<(string | null)[]>([]);
  const [editingPendingAttachments, setEditingPendingAttachments] = useState<File[]>([]);
  const [editingPendingAttachPreviews, setEditingPendingAttachPreviews] = useState<
    (string | null)[]
  >([]);
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["comments", "logs", "files"] as const).withDefault("comments"),
  );
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  // ── Local field state (batched by Save Changes) ────────────────────────────
  const [localStatus, setLocalStatus] = useState("todo");
  const [localPriority, setLocalPriority] = useState<string | null>(null);
  const [localAssignees, setLocalAssignees] = useState<{ userId: string; name: string }[]>([]);
  const [localDueDate, setLocalDueDate] = useState<string | null>(null);
  const [localEstimate, setLocalEstimate] = useState<number | null>(null);
  const [localReporterId, setLocalReporterId] = useState<string | null>(null);
  const [localReporterName, setLocalReporterName] = useState<string | null>(null);
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [localDescription, setLocalDescription] = useState("");
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [logTimeOpen, setLogTimeOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentAttachRef = useRef<HTMLInputElement>(null);
  const editAttachRef = useRef<HTMLInputElement>(null);
  const feedScrollRef = useRef<HTMLDivElement>(null);

  const { data: taskData, isLoading: taskLoading } = useTaskDetail(taskId);
  const { data: commentsData } = useTaskComments(taskId);
  const { data: activityData } = useTaskActivity(taskId);
  const { data: subtasksData } = useSubtasks(taskId);
  const { data: attachmentsData } = useTaskAttachments(taskId);

  const updateTask = useUpdateTask();
  const updateTaskAssignees = useUpdateTaskAssignees();
  const deleteTaskMutation = useDeleteTask();
  const createComment = useCreateComment(taskId ?? "");
  const updateComment = useUpdateComment(taskId ?? "");
  const deleteComment = useDeleteComment(taskId ?? "");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
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

  const task = taskData;
  const comments = commentsData?.comments ?? [];
  const activity = activityData?.activity ?? [];
  const subtasks = subtasksData?.subtasks ?? [];
  const attachments = attachmentsData?.attachments ?? [];

  const subtasksDone = subtasks.filter((s) => s.status === "done").length;

  // ── Sync local state when a new task is opened ────────────────────────────
  useEffect(() => {
    if (!task) return;
    setLocalStatus(task.status);
    setLocalPriority(task.priority ?? null);
    const assigneesFromTask =
      (task.assignees ?? []).length > 0
        ? (task.assignees as { userId: string; name: string }[])
        : task.assigneeUserId
          ? [{ userId: task.assigneeUserId, name: task.assigneeName ?? "" }]
          : [];
    setLocalAssignees(assigneesFromTask);
    setLocalDueDate(task.dueDate ?? null);
    setLocalEstimate(task.estimateMinutes ?? null);
    setLocalReporterId(task.reporterUserId ?? null);
    setLocalReporterName(task.reporterName ?? null);
    setLocalTags(task.tags ?? []);
    setLocalDescription(task.description ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  const taskAssigneeIds = (() => {
    const base =
      (task?.assignees ?? []).length > 0
        ? (task?.assignees ?? []).map((a) => a.userId)
        : task?.assigneeUserId
          ? [task.assigneeUserId]
          : [];
    return [...base].sort();
  })();
  const localAssigneeIds = [...localAssignees.map((a) => a.userId)].sort();

  const isDirty =
    !!task &&
    (localStatus !== task.status ||
      (localPriority ?? null) !== (task.priority ?? null) ||
      JSON.stringify(localAssigneeIds) !== JSON.stringify(taskAssigneeIds) ||
      (localDueDate ?? null) !== (task.dueDate ?? null) ||
      (localEstimate ?? null) !== (task.estimateMinutes ?? null) ||
      JSON.stringify([...localTags].sort()) !== JSON.stringify([...(task.tags ?? [])].sort()) ||
      localDescription !== (task.description ?? ""));

  // ─── Save helpers ──────────────────────────────────────────────────────────

  function handleSaveChanges() {
    if (!task) return;
    updateTask.mutate(
      {
        taskId: task.id,
        data: {
          projectId: task.projectId,
          title: task.title,
          description: localDescription,
          status: localStatus,
          priority: localPriority,
          assigneeUserId: localAssignees[0]?.userId ?? null,
          dueDate: localDueDate,
          estimateMinutes: localEstimate,
          columnId: task.columnId ?? null,
          tags: localTags,
        },
      },
      {
        onSuccess: () => {
          updateTaskAssignees.mutate(
            { taskId: task.id, userIds: localAssignees.map((a) => a.userId) },
            {
              onSuccess: () => toast.success("Changes saved."),
              onError: (err) => toast.error(err.message ?? "Failed to update assignees."),
            },
          );
        },
        onError: (err) => toast.error(err.message ?? "Failed to update task."),
      },
    );
  }

  function handleDiscard() {
    if (!task) return;
    setLocalStatus(task.status);
    setLocalPriority(task.priority ?? null);
    const assigneesFromTask =
      (task.assignees ?? []).length > 0
        ? (task.assignees as { userId: string; name: string }[])
        : task.assigneeUserId
          ? [{ userId: task.assigneeUserId, name: task.assigneeName ?? "" }]
          : [];
    setLocalAssignees(assigneesFromTask);
    setLocalDueDate(task.dueDate ?? null);
    setLocalEstimate(task.estimateMinutes ?? null);
    setLocalReporterId(task.reporterUserId ?? null);
    setLocalReporterName(task.reporterName ?? null);
    setLocalTags(task.tags ?? []);
    setLocalDescription(task.description ?? "");
  }

  function saveField(updates: Record<string, unknown>) {
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
          tags: task.tags ?? [],
          ...updates,
        },
      },
      {
        onError: (err) => toast.error(err.message ?? "Failed to update task."),
      },
    );
  }

  function toggleTag(tag: string) {
    const updated = localTags.includes(tag)
      ? localTags.filter((t) => t !== tag)
      : [...localTags, tag];
    setLocalTags(updated);
  }

  const allTagOptions = Array.from(new Set([...TASK_TAG_OPTIONS, ...localTags]));
  const filteredTagOptions = tagSearch
    ? allTagOptions.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()))
    : allTagOptions;

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

  const selectedPriority = PRIORITY_OPTIONS.find((p) => p.value === localPriority);

  // Merge comments + activity + file uploads for the right sidebar feed
  const feed = [
    ...comments.map((c) => ({
      id: c.id,
      type: "comment" as const,
      actorName: c.authorName,
      actorUserId: c.authorUserId as string | null,
      authorId: c.authorUserId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      body: c.body,
      action: null as string | null,
      oldValues: null as Record<string, unknown> | null,
      newValues: null as Record<string, unknown> | null,
      fileName: null as string | null,
      mimeType: null as string | null,
      storageUrl: null as string | null,
      sizeBytes: null as number | null,
    })),
    ...activity.map((a) => ({
      id: a.id,
      type: "activity" as const,
      actorName: a.actorName,
      actorUserId: a.actorUserId as string | null,
      createdAt: a.createdAt,
      body: null as string | null,
      action: a.action,
      oldValues: a.oldValues,
      newValues: a.newValues,
      authorId: null as string | null,
      updatedAt: null as string | null,
      fileName: null as string | null,
      mimeType: null as string | null,
      storageUrl: null as string | null,
      sizeBytes: null as number | null,
    })),
    ...attachments.map((a) => ({
      id: `file-${a.id}`,
      type: "file" as const,
      actorName: a.uploaderName,
      actorUserId: null as string | null,
      authorId: null as string | null,
      createdAt: a.createdAt,
      updatedAt: null as string | null,
      body: null as string | null,
      action: null as string | null,
      oldValues: null as Record<string, unknown> | null,
      newValues: null as Record<string, unknown> | null,
      fileName: a.fileName,
      mimeType: a.mimeType,
      storageUrl: a.storageUrl,
      sizeBytes: a.sizeBytes,
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Scroll feed to bottom whenever comments/files are added
  useEffect(() => {
    const el = feedScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [feed.length]);

  return (
    <Dialog
      open={!!taskId}
      onOpenChange={(v) => {
        if (!v) {
          setActiveTab(null);
          onClose();
        }
      }}
    >
      <DialogContent
        className="w-[90vw] max-w-350! gap-0 overflow-visible p-0"
        showCloseButton={false}
        onInteractOutside={(e) => {
          // e.target is the DialogContent node itself (Radix dispatches the custom event on it).
          // The actual outside element is in e.detail.originalEvent.target.
          const outsideTarget = (e as CustomEvent<{ originalEvent: Event }>).detail?.originalEvent
            ?.target as Element | null;
          if (outsideTarget?.closest?.("[data-mention-dropdown]")) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">{task?.title ?? "Task detail"}</DialogTitle>

        {/* Full-height flex layout - own div so we're not fighting DialogContent's base `grid` class */}
        <div className="flex h-[90vh] flex-col overflow-hidden rounded-xl">
          {/* ── Modal header bar ── */}
          <div className="border-border flex shrink-0 items-center gap-3 border-b px-5 py-2.5">
            <div className="text-muted-foreground flex min-w-0 flex-1 items-center gap-1.5 text-xs">
              <Folder size={11} className="shrink-0" />
              <span className="truncate">{task?.projectName ?? "-"}</span>
              {task?.columnName && (
                <>
                  <span className="text-border">/</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: task.columnColor ?? DEFAULT_COLUMN_COLOR }}
                  >
                    {task.columnName}
                  </span>
                </>
              )}
              {task?.refNumber && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-muted-foreground/70 font-mono text-[10px]">
                    {task.refNumber}
                  </span>
                </>
              )}
            </div>
            {task && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors"
                    aria-label="Task options"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => setConfirmDelete(true)}
                    className="text-danger! focus:text-danger! hover:text-danger focus:bg-danger/10 cursor-pointer gap-2 text-xs"
                  >
                    <Trash2 size={13} />
                    Delete task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {taskLoading || !task ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* ─── Left pane ──────────────────────────────────────────────── */}
              <div className="scrollbar-thin border-border min-h-0 flex-1 overflow-y-auto border-r p-6">
                {/* Title */}
                <DialogHeader className="mb-5">
                  <InlineTitle value={task.title} onSave={(v) => saveField({ title: v })} />
                </DialogHeader>

                {/* Properties - 2-column grid */}
                <div className="rounded-card border-border mb-5 overflow-hidden border text-sm">
                  {/* Status - full width */}
                  <div className="border-border flex items-center justify-between gap-1 border-r border-b px-4 py-2.5">
                    <div className="text-muted-foreground flex w-24 shrink-0 items-center gap-1.5 text-xs font-medium">
                      <AlertCircle size={11} /> Status
                    </div>
                    <Select value={localStatus} onValueChange={setLocalStatus}>
                      <SelectTrigger className="h-8 w-44 cursor-pointer border bg-transparent px-2 text-xs shadow-none focus:ring-0">
                        <SelectValue>
                          {(() => {
                            const opt = STATUS_OPTIONS.find((o) => o.value === localStatus);
                            return opt ? (
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: opt.color }}
                                />
                                {opt.label}
                              </span>
                            ) : null;
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" align="start">
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: opt.color }}
                              />
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2-column grid */}
                  <div className="grid grid-cols-2">
                    {/* Priority */}
                    <div className="border-border flex items-center justify-between gap-1 border-r border-b px-4 py-2.5">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                        <Flag size={10} /> Priority
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="text-foreground hover:text-foreground flex h-8 cursor-pointer items-center gap-1.5 rounded-md border p-3 text-xs transition-colors"
                          >
                            {selectedPriority ? (
                              <>
                                {/* <span
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: selectedPriority.color,
                                  }}
                                /> */}
                                <span
                                  className={`rounded-pill px-1.5 py-0.5 text-[10px] font-medium capitalize ${PRIORITY_BADGE[localPriority ?? ""] ?? ""}`}
                                >
                                  {selectedPriority.label}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">No priority</span>
                            )}
                            <ChevronDown size={11} className="text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-36">
                          <DropdownMenuItem
                            onClick={() => setLocalPriority(null)}
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <span className="border-muted-foreground h-2 w-2 rounded-full border" />{" "}
                            None
                          </DropdownMenuItem>
                          {PRIORITY_OPTIONS.map((opt) => (
                            <DropdownMenuItem
                              key={opt.value}
                              onClick={() => setLocalPriority(opt.value)}
                              className="cursor-pointer gap-2 text-xs"
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: opt.color }}
                              />
                              {opt.label}
                              {localPriority === opt.value && (
                                <span className="text-muted-foreground ml-auto text-[10px]">✓</span>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Assignee - multi-select */}
                    <div className="border-border flex items-center justify-between gap-1 border-r border-b px-4 py-2.5">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                        <User size={10} /> Assignee
                      </span>
                      <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="hover:text-foreground flex h-8.5 min-w-0 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs transition-colors"
                          >
                            {localAssignees.length > 0 ? (
                              <>
                                <div className="flex -space-x-1.5">
                                  {localAssignees.slice(0, 3).map((a) => (
                                    <div
                                      key={a.userId}
                                      className={cn(
                                        "ring-background flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ring-1",
                                        a.userId === currentUserId
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-brand-100 text-primary",
                                      )}
                                      title={a.name}
                                    >
                                      {getInitials(a.name)}
                                    </div>
                                  ))}
                                  {localAssignees.length > 3 && (
                                    <div className="bg-secondary text-foreground ring-background flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ring-1">
                                      +{localAssignees.length - 3}
                                    </div>
                                  )}
                                </div>
                                <span className="text-foreground truncate">
                                  {localAssignees.length === 1
                                    ? localAssignees[0].name
                                    : `${localAssignees.length} assignees`}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                            <ChevronDown size={11} className="text-muted-foreground shrink-0" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="start">
                          <Input
                            placeholder="Search members…"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="mb-2 h-7 text-xs"
                          />
                          <div className="max-h-48 space-y-0.5 overflow-y-auto">
                            {localAssignees.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLocalAssignees([]);
                                  setAssigneeOpen(false);
                                }}
                                className="text-muted-foreground hover:bg-secondary flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-xs"
                              >
                                <User size={14} /> Unassign all
                              </button>
                            )}
                            {filteredMembers.map((m) => {
                              const isSelected = localAssignees.some((a) => a.userId === m.userId);
                              return (
                                <button
                                  key={m.userId}
                                  type="button"
                                  onClick={() => {
                                    setLocalAssignees((prev) =>
                                      isSelected
                                        ? prev.filter((a) => a.userId !== m.userId)
                                        : [...prev, { userId: m.userId, name: m.name }],
                                    );
                                    setMemberSearch("");
                                  }}
                                  className={cn(
                                    "flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
                                    isSelected
                                      ? "bg-secondary text-foreground font-medium"
                                      : "hover:bg-secondary/50 text-muted-foreground",
                                  )}
                                >
                                  <div className="bg-brand-100 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold">
                                    {getInitials(m.name)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-foreground truncate">{m.name}</p>
                                    <p className="text-muted-foreground truncate">{m.email}</p>
                                  </div>
                                  {isSelected && (
                                    <Check size={11} className="text-primary shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Due date */}
                    <div className="border-border flex items-center justify-between gap-1 border-r border-b px-4 py-2.5">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                        <CalendarDays size={10} /> Due date
                      </span>
                      <div className="flex min-w-0 items-center gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "hover:bg-secondary flex h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-xs transition-colors",
                                localDueDate
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground",
                              )}
                            >
                              <CalendarDays size={12} />
                              {localDueDate ? formatDateDayMonthYear(localDueDate) : "Set date"}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={localDueDate ? new Date(localDueDate) : undefined}
                              onSelect={(date) => setLocalDueDate(date ? date.toISOString() : null)}
                            />
                          </PopoverContent>
                        </Popover>
                        {localDueDate && (
                          <button
                            type="button"
                            onClick={() => setLocalDueDate(null)}
                            className="text-muted-foreground hover:text-foreground flex h-5 w-5 items-center justify-center rounded transition-colors"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Estimate */}
                    <div className="border-border flex items-center justify-between gap-1 border-r border-b px-4 py-2.5">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                        <Clock size={10} /> Estimate
                      </span>
                      <TimeEstimateInput
                        value={localEstimate}
                        onChange={setLocalEstimate}
                        size="sm"
                        displayPlaceholder="Set estimate"
                      />
                    </div>

                    {/* Log Time */}
                    <div className="border-border flex items-center justify-between gap-1 border-r border-b px-4 py-2.5">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                        <Clock size={10} /> Time Logged
                      </span>
                      <button
                        type="button"
                        onClick={() => setLogTimeOpen(true)}
                        className="border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground flex h-8 cursor-pointer items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors"
                      >
                        <Plus size={10} />
                        Log time
                      </button>
                    </div>

                    {/* Reporter - static display */}
                    <div className="border-border flex items-center justify-between gap-1 border-r border-b px-4 py-2.5">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                        <User size={10} /> Reporter
                      </span>
                      {localReporterName ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
                              localReporterId === currentUserId
                                ? "bg-primary text-primary-foreground"
                                : "bg-brand-100 text-primary",
                            )}
                          >
                            {getInitials(localReporterName)}
                          </div>
                          <span className="text-foreground text-xs">{localReporterName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>

                    {/* Created at */}
                    <div className="border-border flex items-center justify-between gap-1 border-r border-b px-4 py-2.5">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                        <Clock size={10} /> Created
                      </span>
                      <RelativeTime
                        iso={task.createdAt}
                        className="text-muted-foreground text-xs"
                      />
                    </div>

                    {/* Updated at */}
                    <div className="border-border flex items-center justify-between gap-1 border-r border-b px-4 py-2.5">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                        <Clock size={10} /> Updated
                      </span>
                      <RelativeTime
                        iso={task.updatedAt}
                        className="text-muted-foreground text-xs"
                      />
                    </div>
                  </div>

                  {/* Save / Discard bar */}
                  {isDirty && (
                    <div className="border-border bg-secondary/40 flex items-center justify-end gap-2 border-t px-4 py-2">
                      <button
                        type="button"
                        onClick={handleDiscard}
                        className="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition-colors"
                      >
                        Discard
                      </button>
                      <Button
                        size="sm"
                        className="h-7 cursor-pointer px-3 text-xs"
                        onClick={handleSaveChanges}
                        disabled={updateTask.isPending}
                      >
                        {updateTask.isPending ? "Saving…" : "Save Changes"}
                      </Button>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="border-border border-t px-4 py-3">
                    <div className="text-muted-foreground mb-2.5 flex items-center gap-1.5 text-[11px] font-medium">
                      <Tag size={10} /> Tags
                    </div>
                    {/* Selected tags */}
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {localTags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                            TAG_COLORS[tag] ?? "bg-secondary text-foreground border-transparent",
                          )}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className="text-current opacity-60 hover:opacity-100"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    {/* Combobox popover */}
                    <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-xs transition-colors"
                        >
                          <Plus size={11} /> Add tag
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-52 bg-white p-2"
                        align="start"
                        side="bottom"
                        sideOffset={4}
                      >
                        <Input
                          placeholder="Search or create tag…"
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          className="mb-2 h-7 text-xs"
                        />
                        <div className="max-h-40 space-y-0.5 overflow-y-auto">
                          {filteredTagOptions.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                toggleTag(tag);
                                setTagSearch("");
                              }}
                              className={cn(
                                "flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs capitalize transition-colors",
                                localTags.includes(tag)
                                  ? "bg-secondary font-medium"
                                  : "hover:bg-secondary/50 text-muted-foreground",
                              )}
                            >
                              {tag}
                              {localTags.includes(tag) && (
                                <Check size={11} className="text-primary" />
                              )}
                            </button>
                          ))}
                          {tagSearch && !allTagOptions.includes(tagSearch.toLowerCase()) && (
                            <button
                              type="button"
                              onClick={() => {
                                toggleTag(tagSearch.toLowerCase());
                                setTagSearch("");
                              }}
                              className="text-primary hover:bg-secondary/50 flex w-full cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors"
                            >
                              <Plus size={11} /> Create &ldquo;{tagSearch}
                              &rdquo;
                            </button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-5">
                  <p className="text-foreground mb-2 text-sm font-medium">Description</p>
                  <div className="rounded-card border-border overflow-hidden border">
                    <TiptapEditor
                      key={task.id}
                      content={localDescription}
                      placeholder="Add a description…"
                      members={allMembers.map((m) => ({
                        id: m.userId,
                        name: m.name,
                      }))}
                      onChange={(html) => {
                        const normalized = html === "<p></p>" ? "" : html;
                        setLocalDescription(normalized);
                      }}
                    />
                  </div>
                </div>

                {/* ─── Time Logged ──────────────────────────────────────────── */}
                {task?.id && (
                  <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
                        <Clock size={13} />
                        Time Logged
                      </p>
                      <button
                        type="button"
                        onClick={() => setLogTimeOpen(true)}
                        className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-xs transition-colors"
                      >
                        <Plus size={12} /> Log
                      </button>
                    </div>
                    <TimeEntriesList taskId={task.id} currentUserId={currentUserId ?? ""} />
                  </div>
                )}

                {/* ─── Subtasks ─────────────────────────────────────────────── */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
                      <CheckSquare size={13} />
                      Subtasks
                      {subtasks.length > 0 && (
                        <span className="text-muted-foreground ml-1 text-xs font-normal">
                          {subtasksDone}/{subtasks.length}
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubtaskDialogOpen(true)}
                      className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-xs transition-colors"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>

                  {/* Progress bar */}
                  {subtasks.length > 0 && (
                    <div className="bg-border mb-2 h-1 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-success h-full rounded-full transition-all duration-300"
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
                        className="group hover:bg-secondary/50 flex items-start gap-2 rounded px-2 py-1.5 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleSubtask.mutate(sub.id, {
                              onError: (err) => toast.error(err.message ?? "Failed to update."),
                            })
                          }
                          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 transition-colors"
                        >
                          {sub.status === "done" ? (
                            <CheckSquare size={14} className="text-success" />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-xs",
                              sub.status === "done"
                                ? "text-muted-foreground line-through"
                                : "text-foreground",
                            )}
                          >
                            {sub.title}
                          </span>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            {sub.assigneeName && (
                              <span className="text-muted-foreground flex items-center gap-0.5 text-[10px]">
                                <User size={9} /> {sub.assigneeName}
                              </span>
                            )}
                            <RelativeTime
                              iso={sub.createdAt}
                              className="text-muted-foreground text-[10px]"
                            />
                            {(sub.tags ?? []).map((t) => (
                              <span
                                key={t}
                                className={cn(
                                  "rounded-full border px-1.5 py-0 text-[9px] font-medium capitalize",
                                  TAG_COLORS[t] ?? "bg-secondary text-foreground border-border",
                                )}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            deleteSubtaskMutation.mutate(sub.id, {
                              onError: (err) => toast.error(err.message ?? "Failed to delete."),
                            })
                          }
                          className="text-muted-foreground hover:text-danger mt-0.5 shrink-0 opacity-0 transition-all group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meta */}
                <p className="text-muted-foreground mt-auto pt-2 text-[11px]">
                  Created <RelativeTime iso={task.createdAt} />
                  {task.reporterName ? ` by ${task.reporterName}` : ""}
                </p>
              </div>

              {/* ─── Right pane ─────────────────────────────────────────────── */}
              <div className="bg-secondary/20 flex w-120 shrink-0 flex-col overflow-hidden">
                {/* Tabs header */}
                <div className="border-border flex items-center gap-0 border-b px-4 pt-3 pb-0">
                  {(["comments", "logs", "files"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "cursor-pointer border-b-2 px-3 pt-0.5 pb-2.5 text-xs font-medium capitalize transition-colors",
                        activeTab === tab
                          ? "border-primary text-primary"
                          : "text-muted-foreground hover:text-foreground border-transparent",
                      )}
                    >
                      {tab === "comments"
                        ? "Comments"
                        : tab === "logs"
                          ? "Logs"
                          : `Files${attachments.length > 0 ? ` (${attachments.length})` : ""}`}
                    </button>
                  ))}
                </div>

                {/* Feed - Comments & Logs tabs */}
                {activeTab !== "files" && (
                  <div
                    ref={feedScrollRef}
                    className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-4"
                  >
                    {(() => {
                      const visibleFeed =
                        activeTab === "comments"
                          ? feed
                              .filter((i) => i.type === "comment" || i.type === "file")
                              .sort(
                                (a, b) =>
                                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                              )
                          : feed
                              .filter((i) => i.type === "activity")
                              .sort(
                                (a, b) =>
                                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                              );
                      if (visibleFeed.length === 0) {
                        return (
                          <p className="text-muted-foreground py-4 text-center text-xs">
                            {activeTab === "comments" ? "No comments yet." : "No activity yet."}
                          </p>
                        );
                      }
                      return visibleFeed.map((item) => (
                        <div key={item.id} className="group">
                          {item.type === "comment" ? (
                            /* ── Comment ── */
                            <div className="flex gap-2.5">
                              {/* Avatar */}
                              <div
                                className={cn(
                                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                                  item.actorUserId === currentUserId
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-primary/10 text-primary",
                                )}
                              >
                                {getInitials(item.actorName)}
                              </div>

                              <div className="min-w-0 flex-1">
                                {/* Name + time + actions */}
                                <div className="mb-1 flex items-center gap-1.5">
                                  <span className="text-foreground text-[11px] leading-none font-semibold">
                                    {item.actorName ?? "Someone"}
                                  </span>
                                  <RelativeTime
                                    iso={item.createdAt}
                                    className="text-muted-foreground text-[10px] leading-none"
                                  />
                                  {item.updatedAt && item.updatedAt !== item.createdAt && (
                                    <EditedBadge updatedAt={item.updatedAt} />
                                  )}
                                  {currentUserId && item.authorId === currentUserId && (
                                    <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommentId(item.id);
                                          setEditingCommentBody(item.body ?? "");
                                          setEditingPendingAttachments([]);
                                          setEditingPendingAttachPreviews([]);
                                        }}
                                        className="hover:bg-secondary text-muted-foreground hover:text-foreground flex h-5 w-5 cursor-pointer items-center justify-center rounded transition-colors"
                                      >
                                        <Pencil size={10} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          deleteComment.mutate(item.id, {
                                            onError: (err) =>
                                              toast.error(err.message ?? "Failed to delete."),
                                          })
                                        }
                                        disabled={deleteComment.isPending}
                                        className="text-muted-foreground flex h-5 w-5 cursor-pointer items-center justify-center rounded transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Body or edit mode */}
                                {editingCommentId === item.id ? (
                                  <div className="border-ring/60 bg-background overflow-hidden rounded-lg border shadow-sm">
                                    <TiptapEditor
                                      key={`edit-${item.id}`}
                                      content={editingCommentBody}
                                      minimal
                                      members={allMembers.map((m) => ({
                                        id: m.userId,
                                        name: m.name,
                                      }))}
                                      onChange={setEditingCommentBody}
                                      onSubmit={() => {
                                        if (!editingCommentBody.trim() || updateComment.isPending)
                                          return;
                                        updateComment.mutate(
                                          { commentId: item.id, body: editingCommentBody },
                                          {
                                            onSuccess: () => setEditingCommentId(null),
                                            onError: (err) => toast.error(err.message),
                                          },
                                        );
                                      }}
                                      placeholder="Edit comment…"
                                    />
                                    <div className="border-border/60 bg-secondary/20 flex items-center justify-between border-t px-2.5 py-1.5">
                                      <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              type="button"
                                              disabled={uploadAttachment.isPending}
                                              onClick={() => editAttachRef.current?.click()}
                                              className="text-muted-foreground/50 hover:text-foreground hover:bg-secondary flex h-5 w-5 cursor-pointer items-center justify-center rounded transition-colors disabled:opacity-40"
                                            >
                                              <Paperclip size={11} />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top">
                                            Attach files (max 5 MB each)
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <input
                                        ref={editAttachRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                          const files = Array.from(e.target.files ?? []);
                                          const valid = files.filter((f) => {
                                            if (f.size > 5 * 1024 * 1024) {
                                              toast.error(
                                                `"${f.name}" exceeds 5 MB and was skipped.`,
                                              );
                                              return false;
                                            }
                                            return true;
                                          });
                                          setEditingPendingAttachments((prev) => [
                                            ...prev,
                                            ...valid,
                                          ]);
                                          valid.forEach((file, idx) => {
                                            if (file.type.startsWith("image/")) {
                                              const reader = new FileReader();
                                              reader.onload = (ev) =>
                                                setEditingPendingAttachPreviews((prev) => {
                                                  const next = [...prev];
                                                  next[editingPendingAttachments.length + idx] = ev
                                                    .target?.result as string;
                                                  return next;
                                                });
                                              reader.readAsDataURL(file);
                                            } else {
                                              setEditingPendingAttachPreviews((prev) => {
                                                const next = [...prev];
                                                next[editingPendingAttachments.length + idx] = null;
                                                return next;
                                              });
                                            }
                                          });
                                          e.target.value = "";
                                        }}
                                      />
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingCommentId(null);
                                            setEditingPendingAttachments([]);
                                            setEditingPendingAttachPreviews([]);
                                          }}
                                          className="text-muted-foreground hover:text-foreground cursor-pointer rounded border px-2 py-0.5 text-[11px] transition-colors"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (editingPendingAttachments.length > 0) {
                                              try {
                                                for (const file of editingPendingAttachments) {
                                                  await uploadAttachment.mutateAsync({ file });
                                                }
                                                setEditingPendingAttachments([]);
                                                setEditingPendingAttachPreviews([]);
                                              } catch (err) {
                                                toast.error(
                                                  err instanceof Error
                                                    ? err.message
                                                    : "Upload failed.",
                                                );
                                                return;
                                              }
                                            }
                                            updateComment.mutate(
                                              { commentId: item.id, body: editingCommentBody },
                                              {
                                                onSuccess: () => setEditingCommentId(null),
                                                onError: (err) => toast.error(err.message),
                                              },
                                            );
                                          }}
                                          disabled={
                                            (!editingCommentBody.trim() &&
                                              editingPendingAttachments.length === 0) ||
                                            updateComment.isPending ||
                                            uploadAttachment.isPending
                                          }
                                          className="bg-primary text-primary-foreground flex cursor-pointer items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-medium transition-opacity disabled:opacity-50"
                                        >
                                          <Check size={10} />{" "}
                                          {updateComment.isPending || uploadAttachment.isPending
                                            ? "Saving…"
                                            : "Save"}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Edit pending attachments preview */}
                                    {editingPendingAttachments.length > 0 && (
                                      <div className="border-border/60 bg-secondary/10 flex flex-wrap gap-2 border-t px-2.5 py-2">
                                        {editingPendingAttachments.map((file, idx) => (
                                          <div
                                            key={idx}
                                            className="border-border bg-background relative flex max-w-[180px] items-center gap-1.5 rounded border px-2 py-1 pr-6"
                                          >
                                            {editingPendingAttachPreviews[idx] ? (
                                              <Image
                                                src={editingPendingAttachPreviews[idx]!}
                                                alt={file.name}
                                                width={24}
                                                height={24}
                                                unoptimized
                                                className="h-6 w-6 shrink-0 rounded object-cover"
                                              />
                                            ) : (
                                              <Paperclip
                                                size={11}
                                                className="text-muted-foreground shrink-0"
                                              />
                                            )}
                                            <div className="min-w-0">
                                              <p className="text-foreground truncate text-[10px] font-medium">
                                                {file.name}
                                              </p>
                                              <p className="text-muted-foreground text-[9px]">
                                                {(file.size / 1024).toFixed(0)} KB
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingPendingAttachments((prev) =>
                                                  prev.filter((_, i) => i !== idx),
                                                );
                                                setEditingPendingAttachPreviews((prev) =>
                                                  prev.filter((_, i) => i !== idx),
                                                );
                                              }}
                                              className="text-muted-foreground hover:text-danger absolute top-1/2 right-1 flex h-4 w-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded transition-colors"
                                            >
                                              <X size={10} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <CommentBody
                                    html={item.body ?? ""}
                                    members={allMembers}
                                    className="text-foreground prose prose-sm [&_code]:bg-secondary max-w-none text-xs leading-relaxed [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[11px] [&_p]:my-0 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold"
                                  />
                                )}
                              </div>
                            </div>
                          ) : item.type === "file" ? (
                            /* ── File upload ── */
                            <div className="flex gap-2.5">
                              <div
                                className={cn(
                                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                                  item.actorUserId === currentUserId
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-primary/10 text-primary",
                                )}
                              >
                                {getInitials(item.actorName)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1.5 flex items-center gap-1.5">
                                  <span className="text-foreground text-[11px] leading-none font-semibold">
                                    {item.actorName ?? "Someone"}
                                  </span>
                                  <span className="text-muted-foreground text-[10px] leading-none">
                                    attached a file
                                  </span>
                                  <RelativeTime
                                    iso={item.createdAt}
                                    className="text-muted-foreground/60 text-[10px] leading-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteAttachmentMutation.mutate(
                                        item.id.replace(/^file-/, ""),
                                        {
                                          onError: (err) =>
                                            toast.error(err.message ?? "Failed to delete."),
                                        },
                                      )
                                    }
                                    disabled={deleteAttachmentMutation.isPending}
                                    className="text-muted-foreground ml-auto flex h-5 w-5 cursor-pointer items-center justify-center rounded opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                                {(() => {
                                  const isImage = item.mimeType?.startsWith("image/");
                                  const canPreview = !!item.storageUrl;
                                  return (
                                    <div className="group/file border-border bg-card relative w-fit max-w-full overflow-hidden rounded-lg border">
                                      {isImage && item.storageUrl ? (
                                        <button
                                          type="button"
                                          className="relative block"
                                          onClick={() =>
                                            setPreviewFile({
                                              id: item.id.replace(/^file-/, ""),
                                              src: item.storageUrl!,
                                              fileName: item.fileName ?? "file",
                                              mimeType: item.mimeType ?? null,
                                              sizeBytes: item.sizeBytes ?? null,
                                            })
                                          }
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={item.storageUrl}
                                            alt={item.fileName ?? ""}
                                            className="h-32 max-w-55 rounded-t-lg object-cover"
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center rounded-t-lg bg-black/0 transition-colors group-hover/file:bg-black/25">
                                            <ZoomIn
                                              size={18}
                                              className="text-white opacity-0 drop-shadow transition-opacity group-hover/file:opacity-100"
                                            />
                                          </div>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={!canPreview}
                                          className="group/thumb relative h-16 w-full cursor-pointer overflow-hidden disabled:cursor-default"
                                          onClick={() =>
                                            canPreview &&
                                            setPreviewFile({
                                              id: item.id.replace(/^file-/, ""),
                                              src: item.storageUrl!,
                                              fileName: item.fileName ?? "file",
                                              mimeType: item.mimeType ?? null,
                                              sizeBytes: item.sizeBytes ?? null,
                                            })
                                          }
                                        >
                                          <FileTypeThumbnail
                                            mimeType={item.mimeType ?? null}
                                            fileName={item.fileName ?? "file"}
                                          />
                                          {canPreview && (
                                            <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition-colors group-hover/thumb:bg-black/10">
                                              <Eye
                                                size={13}
                                                className="text-current opacity-0 drop-shadow transition-opacity group-hover/thumb:opacity-60"
                                              />
                                            </div>
                                          )}
                                        </button>
                                      )}
                                      <div className="border-border/60 flex items-center justify-between gap-2 border-t px-2.5 py-1.5">
                                        <div className="min-w-0">
                                          <p className="text-foreground max-w-40 truncate text-[10px] leading-tight font-medium">
                                            {item.fileName}
                                          </p>
                                          {item.sizeBytes && (
                                            <p className="text-muted-foreground text-[9px]">
                                              {(item.sizeBytes / 1024).toFixed(0)} KB
                                            </p>
                                          )}
                                        </div>
                                        <a
                                          href={item.storageUrl ?? "#"}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-muted-foreground hover:text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors"
                                          title="Download"
                                        >
                                          <Download size={11} />
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          ) : (
                            /* ── Activity ── */
                            <div className="flex items-start gap-2">
                              <div
                                className={cn(
                                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold",
                                  item.actorUserId === currentUserId
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground",
                                )}
                              >
                                {getInitials(item.actorName)}
                              </div>
                              <p className="text-muted-foreground pt-0.5 text-[11px] leading-snug">
                                <span className="text-foreground/80 font-medium">
                                  {item.actorName ?? "Someone"}
                                </span>{" "}
                                {formatActivityMessage(
                                  item.action ?? "",
                                  item.oldValues,
                                  item.newValues,
                                )}
                                <RelativeTime
                                  iso={item.createdAt}
                                  className="text-muted-foreground/60 ml-1.5 text-[10px]"
                                />
                              </p>
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {/* Files tab */}
                {activeTab === "files" && (
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-muted-foreground text-xs font-medium">
                        {attachments.length > 0
                          ? `${attachments.length} file${attachments.length !== 1 ? "s" : ""}`
                          : "No files yet"}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadAttachment.isPending}
                        className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-xs transition-colors disabled:opacity-50"
                      >
                        <Upload size={12} />
                        {uploadAttachment.isPending ? "Uploading…" : "Upload"}
                      </button>
                    </div>
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
                            onError: (err) => toast.error(err.message ?? "Upload failed."),
                          },
                        );
                        e.target.value = "";
                      }}
                    />
                    {attachments.length === 0 ? (
                      <div
                        className="rounded-card border-border hover:border-foreground/30 flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed py-10 text-center transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip size={20} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground text-xs">Click to upload a file</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {attachments.map((att) => {
                          const isImage = att.mimeType?.startsWith("image/");
                          return (
                            <div
                              key={att.id}
                              className="group rounded-card border-border bg-card relative cursor-pointer overflow-hidden border"
                            >
                              {isImage && att.storageUrl ? (
                                <button
                                  type="button"
                                  className="relative block w-full"
                                  onClick={() =>
                                    setPreviewFile({
                                      id: att.id,
                                      src: att.storageUrl!,
                                      fileName: att.fileName,
                                      mimeType: att.mimeType ?? null,
                                      sizeBytes: att.sizeBytes ?? null,
                                    })
                                  }
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={att.storageUrl}
                                    alt={att.fileName}
                                    className="h-20 w-full object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                                    <ZoomIn
                                      size={16}
                                      className="text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100"
                                    />
                                  </div>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="group/thumb relative h-20 w-full cursor-pointer overflow-hidden"
                                  onClick={() =>
                                    att.storageUrl &&
                                    setPreviewFile({
                                      id: att.id,
                                      src: att.storageUrl,
                                      fileName: att.fileName,
                                      mimeType: att.mimeType ?? null,
                                      sizeBytes: att.sizeBytes ?? null,
                                    })
                                  }
                                >
                                  <FileTypeThumbnail
                                    mimeType={att.mimeType ?? null}
                                    fileName={att.fileName}
                                  />
                                  {att.storageUrl && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/thumb:bg-black/10">
                                      <Eye
                                        size={15}
                                        className="text-current opacity-0 drop-shadow transition-opacity group-hover/thumb:opacity-60"
                                      />
                                    </div>
                                  )}
                                </button>
                              )}
                              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                                <div className="min-w-0">
                                  <p className="text-foreground truncate text-[10px] leading-tight">
                                    {att.fileName}
                                  </p>
                                  {att.sizeBytes && (
                                    <p className="text-muted-foreground text-[9px]">
                                      {(att.sizeBytes / 1024).toFixed(0)} KB
                                    </p>
                                  )}
                                </div>
                                <a
                                  href={att.storageUrl ?? "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100"
                                  title="Download"
                                >
                                  <Download size={11} />
                                </a>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  deleteAttachmentMutation.mutate(att.id, {
                                    onError: (err) =>
                                      toast.error(err.message ?? "Failed to delete attachment."),
                                  })
                                }
                                className="bg-card/80 text-muted-foreground hover:text-danger absolute top-1 right-1 cursor-pointer rounded p-0.5 opacity-0 transition-all group-hover:opacity-100"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Comment input - Comments tab only */}
                {activeTab === "comments" && (
                  <div className="border-border border-t px-3 py-3">
                    <div className="border-input bg-background focus-within:border-ring/60 focus-within:ring-ring/20 overflow-hidden rounded-lg border shadow-sm transition-all focus-within:ring-1">
                      <TiptapEditor
                        key={commentKey}
                        content=""
                        minimal
                        members={allMembers.map((m) => ({
                          id: m.userId,
                          name: m.name,
                        }))}
                        onChange={setCommentHtml}
                        onSubmit={() =>
                          !isCommentEmpty && !createComment.isPending && handleSubmitComment()
                        }
                        placeholder="Write a comment… (type @ to mention)"
                        className="text-sm"
                      />
                      <div className="border-border/60 bg-secondary/20 flex items-center justify-between border-t px-2.5 py-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground/50 text-[10px] select-none">
                            @ mention · Enter to post
                          </span>
                          <span className="text-muted-foreground/30 text-[10px] select-none">
                            ·
                          </span>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  disabled={uploadAttachment.isPending}
                                  onClick={() => commentAttachRef.current?.click()}
                                  className="text-muted-foreground/50 hover:text-foreground hover:bg-secondary flex h-5 w-5 cursor-pointer items-center justify-center rounded transition-colors disabled:opacity-40"
                                >
                                  <Paperclip size={11} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Attach file (max 5 MB)</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <input
                            ref={commentAttachRef}
                            type="file"
                            className="hidden"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files ?? []);
                              const valid = files.filter((f) => {
                                if (f.size > 5 * 1024 * 1024) {
                                  toast.error(`"${f.name}" exceeds 5 MB and was skipped.`);
                                  return false;
                                }
                                return true;
                              });
                              setPendingAttachments((prev) => [...prev, ...valid]);
                              valid.forEach((file, idx) => {
                                if (file.type.startsWith("image/")) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) =>
                                    setPendingAttachPreviews((prev) => {
                                      const next = [...prev];
                                      next[pendingAttachments.length + idx] = ev.target
                                        ?.result as string;
                                      return next;
                                    });
                                  reader.readAsDataURL(file);
                                } else {
                                  setPendingAttachPreviews((prev) => {
                                    const next = [...prev];
                                    next[pendingAttachments.length + idx] = null;
                                    return next;
                                  });
                                }
                              });
                              e.target.value = "";
                            }}
                          />
                        </div>
                        <Button
                          size="sm"
                          className="h-6 cursor-pointer gap-1 px-2.5 text-[11px]"
                          disabled={
                            (isCommentEmpty && pendingAttachments.length === 0) ||
                            createComment.isPending ||
                            uploadAttachment.isPending
                          }
                          onClick={async () => {
                            if (pendingAttachments.length > 0) {
                              try {
                                for (const file of pendingAttachments) {
                                  await uploadAttachment.mutateAsync({ file });
                                }
                                toast.success(
                                  `${pendingAttachments.length} file${pendingAttachments.length > 1 ? "s" : ""} attached.`,
                                );
                                setPendingAttachments([]);
                                setPendingAttachPreviews([]);
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Upload failed.");
                                return;
                              }
                            }
                            if (!isCommentEmpty) handleSubmitComment();
                          }}
                        >
                          <Send size={11} />
                          {createComment.isPending || uploadAttachment.isPending
                            ? "Posting…"
                            : "Post"}
                        </Button>
                      </div>

                      {/* Pending attachments preview */}
                      {pendingAttachments.length > 0 && (
                        <div className="border-border/60 bg-secondary/10 flex flex-wrap gap-2 border-t px-2.5 py-2">
                          {pendingAttachments.map((file, idx) => (
                            <div
                              key={idx}
                              className="border-border bg-background relative flex max-w-[180px] items-center gap-1.5 rounded border px-2 py-1 pr-6"
                            >
                              {pendingAttachPreviews[idx] ? (
                                <Image
                                  src={pendingAttachPreviews[idx]!}
                                  alt={file.name}
                                  width={24}
                                  height={24}
                                  unoptimized
                                  className="h-6 w-6 shrink-0 rounded object-cover"
                                />
                              ) : (
                                <Paperclip size={11} className="text-muted-foreground shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-foreground truncate text-[10px] font-medium">
                                  {file.name}
                                </p>
                                <p className="text-muted-foreground text-[9px]">
                                  {(file.size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
                                  setPendingAttachPreviews((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  );
                                }}
                                className="text-muted-foreground hover:text-danger absolute top-1/2 right-1 flex h-4 w-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* end full-height flex wrapper */}
      </DialogContent>

      {/* Subtask creation dialog */}
      {task && (
        <CreateTaskDialog
          open={subtaskDialogOpen}
          onClose={() => setSubtaskDialogOpen(false)}
          parentTaskId={task.id}
          defaultProjectId={task.projectId}
          onCreated={() => {
            if (taskId) {
              qc.invalidateQueries({
                queryKey: taskDetailKeys.subtasks(taskId),
              });
            }
          }}
        />
      )}

      {task?.projectId && (
        <LogTimeDialog
          open={logTimeOpen}
          onClose={() => setLogTimeOpen(false)}
          onLogged={() => {
            if (task?.id) {
              qc.invalidateQueries({ queryKey: timeEntriesKeys.byTask(task.id) });
            }
          }}
          projectId={task.projectId}
          taskId={task.id}
          taskTitle={task.title}
        />
      )}

      <DeleteTaskDialog
        open={confirmDelete}
        taskTitle={task?.title ?? ""}
        isPending={deleteTaskMutation.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!task) return;
          deleteTaskMutation.mutate(
            { taskId: task.id },
            {
              onSuccess: () => {
                setConfirmDelete(false);
                onClose();
              },
            },
          );
        }}
      />

      {/* File preview modal */}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </Dialog>
  );
}
