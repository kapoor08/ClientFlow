"use client";

import { useState, useEffect, useRef } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
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
import {
  useUpdateTask,
  useDeleteTask,
  useUpdateTaskAssignees,
} from "@/core/tasks/useCase";
import { TimeEstimateInput } from "@/components/form";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { http } from "@/core/infrastructure";
import { formatActivityMessage } from "@/core/task-detail/entity";
import { PRIORITY_BADGE } from "@/core/tasks/entity";
import { TASK_PRIORITY_OPTIONS as PRIORITY_OPTIONS, TASK_STATUS_OPTIONS as STATUS_OPTIONS } from "@/constants/task";
import {
  formatDateDayMonthYear,
  formatDateTime,
  formatTimeAgo,
} from "@/utils/date";
import { getFileCategory, type FileCategory } from "@/utils/file";
import { getInitials } from "@/utils/user";
import { TASK_TAG_OPTIONS } from "@/schemas/tasks";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { LogTimeDialog } from "@/components/time-tracking/LogTimeDialog";
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
  Tag,
  MoreHorizontal,
  Pencil,
  Check,
  Download,
  ZoomIn,
  Eye,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileCode,
  File,
  Link2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// ─── Types ─────────────────────────────────────────────────────────────────────

type MemberOption = {
  userId: string;
  name: string;
  email: string;
  roleName?: string;
};

// ─── Relative time helper ──────────────────────────────────────────────────────

/** Renders a relative timestamp that re-evaluates every 30 s. */
function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  return <span className={className}>{formatTimeAgo(iso)}</span>;
}

/** "edited" label with a tooltip showing the exact edit time. */
function EditedBadge({ updatedAt }: { updatedAt: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-[10px] text-muted-foreground/50 italic leading-none cursor-default">
            edited
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>Edited {formatDateTime(updatedAt)}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
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

// ─── Comment body with mention hover cards ────────────────────────────────────

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function CommentBody({
  html,
  members,
  className,
}: {
  html: string;
  members: MemberOption[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let card: HTMLDivElement | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    function removeCard() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      if (card) {
        card.remove();
        card = null;
      }
    }

    function scheduleClose() {
      if (!closeTimer) closeTimer = setTimeout(removeCard, 150);
    }

    function cancelClose() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function showCard(
      member: MemberOption | null,
      label: string,
      rect: DOMRect,
    ) {
      removeCard();

      const name = member?.name ?? label;
      const email = member?.email ?? "";
      const role = member?.roleName ?? "";
      const initial = name.charAt(0).toUpperCase();

      card = document.createElement("div");
      card.setAttribute("data-mention-profile", "");
      card.style.cssText = [
        "position:fixed",
        `z-index:99999`,
        "width:224px",
        "border-radius:12px",
        `border:1px solid hsl(var(--border))`,
        `background:hsl(var(--card))`,
        "box-shadow:0 4px 20px rgba(0,0,0,.13)",
        "overflow:hidden",
        `top:${rect.top - 8}px`,
        `left:${rect.left}px`,
        "transform:translateY(-100%)",
      ].join(";");

      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:14px">
          <div style="width:40px;height:40px;border-radius:50%;background:hsl(var(--primary)/0.1);color:hsl(var(--primary));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;flex-shrink:0">${esc(initial)}</div>
          <div style="min-width:0">
            <p style="margin:0;font-size:14px;font-weight:600;color:hsl(var(--foreground));overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name)}</p>
            ${email ? `<p style="margin:2px 0 0;font-size:11px;color:hsl(var(--muted-foreground));overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(email)}</p>` : ""}
            ${role ? `<span style="display:inline-block;margin-top:5px;border-radius:999px;background:hsl(var(--secondary));padding:2px 8px;font-size:10px;font-weight:500;color:hsl(var(--secondary-foreground))">${esc(role)}</span>` : ""}
          </div>
        </div>`;

      card.addEventListener("mouseenter", cancelClose);
      card.addEventListener("mouseleave", scheduleClose);
      document.body.appendChild(card);
    }

    const mentions = container.querySelectorAll<HTMLElement>(".mention");
    const cleanups: Array<() => void> = [];

    mentions.forEach((el) => {
      const id = el.getAttribute("data-id");
      const rawLabel =
        el.getAttribute("data-label") ??
        el.textContent?.replace(/^@/, "") ??
        "";
      const member = members.find((m) => m.userId === id) ?? null;

      const enter = () => {
        cancelClose();
        showCard(member, rawLabel, el.getBoundingClientRect());
      };
      const leave = () => scheduleClose();

      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
      removeCard();
    };
  }, [html, members]);

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── File preview ──────────────────────────────────────────────────────────────

type PreviewFile = {
  id: string; // attachment DB id - used by the proxy route
  src: string; // original Cloudinary URL (used for images/video/audio)
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

const FILE_TYPE_META: Record<
  FileCategory,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    iconCls: string;
    bg: string;
  }
> = {
  image: {
    icon: FileImage,
    iconCls: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
  pdf: {
    icon: FileText,
    iconCls: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
  video: {
    icon: FileVideo,
    iconCls: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  audio: {
    icon: FileAudio,
    iconCls: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
  office: {
    icon: FileSpreadsheet,
    iconCls: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
  csv: {
    icon: FileSpreadsheet,
    iconCls: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  markdown: {
    icon: FileCode,
    iconCls: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  text: {
    icon: FileCode,
    iconCls: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
  },
  other: { icon: File, iconCls: "text-muted-foreground", bg: "bg-secondary" },
};

function getFileIcon(mimeType: string | null, fileName: string, size = 28) {
  const cat = getFileCategory(mimeType, fileName);
  const { icon: Icon, iconCls } = FILE_TYPE_META[cat];
  return <Icon size={size} className={cn("shrink-0", iconCls)} />;
}

/** Card thumbnail used in the Files tab grid - colored bg + icon + ext label. */
function FileTypeThumbnail({
  mimeType,
  fileName,
}: {
  mimeType: string | null;
  fileName: string;
}) {
  const cat = getFileCategory(mimeType, fileName);
  const { icon: Icon, iconCls, bg } = FILE_TYPE_META[cat];
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "";

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 cursor-pointer",
        bg,
      )}
    >
      <Icon size={26} className={iconCls} />
      {ext && (
        <span className={cn("text-[9px] font-bold tracking-widest", iconCls)}>
          {ext}
        </span>
      )}
    </div>
  );
}

function parseCSV(text: string): string[][] {
  return text
    .trim()
    .split("\n")
    .map((row) => {
      const cols: string[] = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
          inQ = !inQ;
        } else if (ch === "," && !inQ) {
          cols.push(cur.trim());
          cur = "";
        } else {
          cur += ch;
        }
      }
      cols.push(cur.trim());
      return cols;
    });
}

function FilePreviewModal({
  file,
  onClose,
}: {
  file: PreviewFile;
  onClose: () => void;
}) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<string[][] | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const category = getFileCategory(file.mimeType, file.fileName);
  // Proxy route streams the file server-side, bypassing Cloudinary raw-resource auth (401).
  // Images/video/audio load fine directly from Cloudinary CDN so they keep using src.
  const proxyUrl = `/api/tasks/attachments/proxy?id=${encodeURIComponent(file.id)}`;
  const needsFetch =
    category === "text" || category === "markdown" || category === "csv";
  const officeViewerUrl =
    category === "office"
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.src)}`
      : null;

  useEffect(() => {
    if (!needsFetch) return;
    setTextContent(null);
    setCsvRows(null);
    setFetchError(false);
    fetch(proxyUrl)
      .then((r) => r.text())
      .then((text) => {
        if (category === "csv") setCsvRows(parseCSV(text));
        else setTextContent(text);
      })
      .catch(() => setFetchError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.src]);

  // Nested Radix Dialog so it gets its own portal + overlay outside the parent
  // dialog's DismissableLayer - prevents Radix from treating clicks inside the
  // preview as "outside" interactions on the task-detail dialog.
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="w-[92vw] max-w-7xl! p-0 gap-0 flex flex-col overflow-hidden"
        style={{ height: "90vh" }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{file.fileName}</DialogTitle>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
          {getFileIcon(file.mimeType, file.fileName, 15)}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {file.fileName}
            </p>
            {file.sizeBytes ? (
              <p className="text-[10px] text-muted-foreground">
                {(file.sizeBytes / 1024).toFixed(0)} KB
              </p>
            ) : null}
          </div>
          <a
            href={file.src}
            download={file.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Download"
          >
            <Download size={13} />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-secondary/20">
          {category === "image" && (
            <div className="flex h-full items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.src}
                alt={file.fileName}
                className="max-h-full max-w-full rounded-lg object-contain shadow"
              />
            </div>
          )}

          {category === "pdf" && (
            <iframe
              src={proxyUrl}
              className="h-full w-full"
              title={file.fileName}
            />
          )}

          {category === "video" && (
            <div className="flex h-full items-center justify-center p-4">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={file.src}
                controls
                className="max-h-full max-w-full rounded-lg shadow"
              />
            </div>
          )}

          {category === "audio" && (
            <div className="flex h-full items-center justify-center p-6">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio src={file.src} controls className="w-full max-w-md" />
            </div>
          )}

          {category === "office" && officeViewerUrl && (
            <iframe
              src={officeViewerUrl}
              className="h-full w-full"
              title={file.fileName}
            />
          )}

          {(category === "markdown" || category === "text") && (
            <div className="h-full overflow-y-auto p-6">
              {fetchError ? (
                <p className="text-sm text-muted-foreground">
                  Unable to load preview.
                </p>
              ) : textContent === null ? (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Loading…
                </p>
              ) : category === "markdown" ? (
                <article className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{textContent}</ReactMarkdown>
                </article>
              ) : (
                <pre className="whitespace-pre-wrap wrap-break-words font-mono text-xs text-foreground">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {category === "csv" && (
            <div className="h-full overflow-auto p-4">
              {fetchError ? (
                <p className="text-sm text-muted-foreground">
                  Unable to load preview.
                </p>
              ) : csvRows === null ? (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Loading…
                </p>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {(csvRows[0] ?? []).map((cell, i) => (
                        <th
                          key={i}
                          className="border border-border bg-secondary px-2 py-1.5 text-left font-semibold text-foreground whitespace-nowrap"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(1).map((row, ri) => (
                      <tr key={ri} className="even:bg-secondary/30">
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="border border-border px-2 py-1 text-foreground/80 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {category === "other" && (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <File size={48} className="text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Preview not available
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This file type cannot be previewed in the browser
                </p>
              </div>
              <a
                href={file.src}
                download={file.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Download size={12} />
                Download file
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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

// ─── Main Component ────────────────────────────────────────────────────────────

type TaskDetailSheetProps = {
  taskId: string | null;
  onClose: () => void;
  currentUserId?: string;
};

export function TaskDetailSheet({
  taskId,
  onClose,
  currentUserId,
}: TaskDetailSheetProps) {
  const qc = useQueryClient();
  const [commentHtml, setCommentHtml] = useState("");
  const [commentKey, setCommentKey] = useState(0);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [pendingAttachPreviews, setPendingAttachPreviews] = useState<(string | null)[]>([]);
  const [editingPendingAttachments, setEditingPendingAttachments] = useState<File[]>([]);
  const [editingPendingAttachPreviews, setEditingPendingAttachPreviews] = useState<(string | null)[]>([]);
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["comments", "logs", "files"] as const).withDefault(
      "comments",
    ),
  );
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  // ── Local field state (batched by Save Changes) ────────────────────────────
  const [localStatus, setLocalStatus] = useState("todo");
  const [localPriority, setLocalPriority] = useState<string | null>(null);
  const [localAssignees, setLocalAssignees] = useState<
    { userId: string; name: string }[]
  >([]);
  const [localDueDate, setLocalDueDate] = useState<string | null>(null);
  const [localEstimate, setLocalEstimate] = useState<number | null>(null);
  const [localReporterId, setLocalReporterId] = useState<string | null>(null);
  const [localReporterName, setLocalReporterName] = useState<string | null>(
    null,
  );
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
      JSON.stringify([...localTags].sort()) !==
        JSON.stringify([...(task.tags ?? [])].sort()) ||
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
              onError: (err) =>
                toast.error(err.message ?? "Failed to update assignees."),
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

  const allTagOptions = Array.from(
    new Set([...TASK_TAG_OPTIONS, ...localTags]),
  );
  const filteredTagOptions = tagSearch
    ? allTagOptions.filter((t) =>
        t.toLowerCase().includes(tagSearch.toLowerCase()),
      )
    : allTagOptions;

  const isCommentEmpty =
    !commentHtml || commentHtml === "<p></p>" || commentHtml.trim() === "";

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
    (p) => p.value === localPriority,
  );

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
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

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
        className="w-[90vw] max-w-350! p-0 gap-0 overflow-visible"
        showCloseButton={false}
        onInteractOutside={(e) => {
          // e.target is the DialogContent node itself (Radix dispatches the custom event on it).
          // The actual outside element is in e.detail.originalEvent.target.
          const outsideTarget = (e as CustomEvent<{ originalEvent: Event }>)
            .detail?.originalEvent?.target as Element | null;
          if (outsideTarget?.closest?.("[data-mention-dropdown]")) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">
          {task?.title ?? "Task detail"}
        </DialogTitle>

        {/* Full-height flex layout - own div so we're not fighting DialogContent's base `grid` class */}
        <div className="flex h-[90vh] flex-col overflow-hidden rounded-xl">
          {/* ── Modal header bar ── */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
              <Folder size={11} className="shrink-0" />
              <span className="truncate">{task?.projectName ?? "-"}</span>
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
              {task?.refNumber && (
                <>
                  <span className="text-border">·</span>
                  <span className="font-mono text-[10px] text-muted-foreground/70">
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
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Task options"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => setConfirmDelete(true)}
                    className="gap-2 text-xs text-danger! focus:text-danger! hover:text-danger focus:bg-danger/10 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Delete task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {taskLoading || !task ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* ─── Left pane ──────────────────────────────────────────────── */}
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin border-r border-border p-6">
                {/* Title */}
                <DialogHeader className="mb-5">
                  <InlineTitle
                    value={task.title}
                    onSave={(v) => saveField({ title: v })}
                  />
                </DialogHeader>

                {/* Properties - 2-column grid */}
                <div className="mb-5 rounded-card border border-border overflow-hidden text-sm">
                  {/* Status - full width */}
                  <div className="flex items-center justify-between gap-1 border-b border-r border-border px-4 py-2.5">
                    <div className="flex w-24 shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <AlertCircle size={11} /> Status
                    </div>
                    <Select value={localStatus} onValueChange={setLocalStatus}>
                      <SelectTrigger className="h-8 w-44 border cursor-pointer bg-transparent px-2 text-xs shadow-none focus:ring-0">
                        <SelectValue>
                          {(() => {
                            const opt = STATUS_OPTIONS.find(
                              (o) => o.value === localStatus,
                            );
                            return opt ? (
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: opt.color }}
                                />
                                {opt.label}
                              </span>
                            ) : null;
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        side="bottom"
                        align="start"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="text-xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
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
                    <div className="flex items-center justify-between gap-1 border-b border-r border-border px-4 py-2.5">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Flag size={10} /> Priority
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex h-8 items-center gap-1.5 text-xs text-foreground border rounded-md p-3 hover:text-foreground transition-colors cursor-pointer"
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
                              <span className="text-muted-foreground">
                                No priority
                              </span>
                            )}
                            <ChevronDown
                              size={11}
                              className="text-muted-foreground"
                            />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-36">
                          <DropdownMenuItem
                            onClick={() => setLocalPriority(null)}
                            className="gap-2 text-xs cursor-pointer"
                          >
                            <span className="h-2 w-2 rounded-full border border-muted-foreground" />{" "}
                            None
                          </DropdownMenuItem>
                          {PRIORITY_OPTIONS.map((opt) => (
                            <DropdownMenuItem
                              key={opt.value}
                              onClick={() => setLocalPriority(opt.value)}
                              className="gap-2 text-xs cursor-pointer"
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: opt.color }}
                              />
                              {opt.label}
                              {localPriority === opt.value && (
                                <span className="ml-auto text-[10px] text-muted-foreground">
                                  ✓
                                </span>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Assignee - multi-select */}
                    <div className="flex items-center justify-between gap-1 border-b border-r border-border px-4 py-2.5">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <User size={10} /> Assignee
                      </span>
                      <Popover
                        open={assigneeOpen}
                        onOpenChange={setAssigneeOpen}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex h-8.5 border px-3 rounded-md min-w-0 items-center gap-1.5 text-xs hover:text-foreground transition-colors cursor-pointer"
                          >
                            {localAssignees.length > 0 ? (
                              <>
                                <div className="flex -space-x-1.5">
                                  {localAssignees.slice(0, 3).map((a) => (
                                    <div
                                      key={a.userId}
                                      className={cn(
                                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ring-1 ring-background",
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
                                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-foreground ring-1 ring-background">
                                      +{localAssignees.length - 3}
                                    </div>
                                  )}
                                </div>
                                <span className="truncate text-foreground">
                                  {localAssignees.length === 1
                                    ? localAssignees[0].name
                                    : `${localAssignees.length} assignees`}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">
                                Unassigned
                              </span>
                            )}
                            <ChevronDown
                              size={11}
                              className="shrink-0 text-muted-foreground"
                            />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="start">
                          <Input
                            placeholder="Search members…"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="mb-2 h-7 text-xs"
                          />
                          <div className="max-h-48 overflow-y-auto space-y-0.5">
                            {localAssignees.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLocalAssignees([]);
                                  setAssigneeOpen(false);
                                }}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary cursor-pointer"
                              >
                                <User size={14} /> Unassign all
                              </button>
                            )}
                            {filteredMembers.map((m) => {
                              const isSelected = localAssignees.some(
                                (a) => a.userId === m.userId,
                              );
                              return (
                                <button
                                  key={m.userId}
                                  type="button"
                                  onClick={() => {
                                    setLocalAssignees((prev) =>
                                      isSelected
                                        ? prev.filter(
                                            (a) => a.userId !== m.userId,
                                          )
                                        : [
                                            ...prev,
                                            { userId: m.userId, name: m.name },
                                          ],
                                    );
                                    setMemberSearch("");
                                  }}
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors cursor-pointer",
                                    isSelected
                                      ? "bg-secondary text-foreground font-medium"
                                      : "hover:bg-secondary/50 text-muted-foreground",
                                  )}
                                >
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-primary">
                                    {getInitials(m.name)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-foreground">
                                      {m.name}
                                    </p>
                                    <p className="truncate text-muted-foreground">
                                      {m.email}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <Check
                                      size={11}
                                      className="shrink-0 text-primary"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Due date */}
                    <div className="flex items-center justify-between gap-1 border-b border-r border-border px-4 py-2.5">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <CalendarDays size={10} /> Due date
                      </span>
                      <div className="flex min-w-0 items-center gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "flex h-7 items-center gap-1.5 rounded-md border cursor-pointer px-2 text-xs transition-colors hover:bg-secondary",
                                localDueDate
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground",
                              )}
                            >
                              <CalendarDays size={12} />
                              {localDueDate
                                ? formatDateDayMonthYear(localDueDate)
                                : "Set date"}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                localDueDate
                                  ? new Date(localDueDate)
                                  : undefined
                              }
                              onSelect={(date) =>
                                setLocalDueDate(
                                  date ? date.toISOString() : null,
                                )
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        {localDueDate && (
                          <button
                            type="button"
                            onClick={() => setLocalDueDate(null)}
                            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Estimate */}
                    <div className="flex items-center justify-between gap-1 border-b border-r border-border px-4 py-2.5">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
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
                    <div className="flex items-center justify-between gap-1 border-b border-r border-border px-4 py-2.5">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Clock size={10} /> Time Logged
                      </span>
                      <button
                        type="button"
                        onClick={() => setLogTimeOpen(true)}
                        className="flex h-8 items-center gap-1 rounded-md border border-border bg-secondary/50 px-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Plus size={10} />
                        Log time
                      </button>
                    </div>

                    {/* Reporter - static display */}
                    <div className="flex items-center justify-between gap-1 border-b border-r border-border px-4 py-2.5">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
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
                          <span className="text-xs text-foreground">
                            {localReporterName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>

                    {/* Created at */}
                    <div className="flex items-center justify-between gap-1 border-b border-r border-border px-4 py-2.5">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Clock size={10} /> Created
                      </span>
                      <RelativeTime
                        iso={task.createdAt}
                        className="text-xs text-muted-foreground"
                      />
                    </div>

                    {/* Updated at */}
                    <div className="flex items-center justify-between gap-1 border-b border-r border-border px-4 py-2.5">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Clock size={10} /> Updated
                      </span>
                      <RelativeTime
                        iso={task.updatedAt}
                        className="text-xs text-muted-foreground"
                      />
                    </div>
                  </div>

                  {/* Save / Discard bar */}
                  {isDirty && (
                    <div className="flex items-center justify-end gap-2 border-t border-border bg-secondary/40 px-4 py-2">
                      <button
                        type="button"
                        onClick={handleDiscard}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        Discard
                      </button>
                      <Button
                        size="sm"
                        className="h-7 text-xs px-3 cursor-pointer"
                        onClick={handleSaveChanges}
                        disabled={updateTask.isPending}
                      >
                        {updateTask.isPending ? "Saving…" : "Save Changes"}
                      </Button>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="border-t border-border px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-2.5">
                      <Tag size={10} /> Tags
                    </div>
                    {/* Selected tags */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {localTags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                            TAG_COLORS[tag] ??
                              "bg-secondary text-foreground border-transparent",
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
                    <Popover
                      open={tagPopoverOpen}
                      onOpenChange={setTagPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                        <div className="max-h-40 overflow-y-auto space-y-0.5">
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
                          {tagSearch &&
                            !allTagOptions.includes(
                              tagSearch.toLowerCase(),
                            ) && (
                              <button
                                type="button"
                                onClick={() => {
                                  toggleTag(tagSearch.toLowerCase());
                                  setTagSearch("");
                                }}
                                className="flex w-full cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-xs text-primary hover:bg-secondary/50 transition-colors"
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
                  <p className="mb-2 text-sm font-medium text-foreground">
                    Description
                  </p>
                  <div className="rounded-card border border-border overflow-hidden">
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
                      onClick={() => setSubtaskDialogOpen(true)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                        className="group flex items-start gap-2 rounded px-2 py-1.5 hover:bg-secondary/50 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleSubtask.mutate(sub.id, {
                              onError: (err) =>
                                toast.error(err.message ?? "Failed to update."),
                            })
                          }
                          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {sub.status === "done" ? (
                            <CheckSquare size={14} className="text-success" />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "text-xs block",
                              sub.status === "done"
                                ? "line-through text-muted-foreground"
                                : "text-foreground",
                            )}
                          >
                            {sub.title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {sub.assigneeName && (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <User size={9} /> {sub.assigneeName}
                              </span>
                            )}
                            <RelativeTime
                              iso={sub.createdAt}
                              className="text-[10px] text-muted-foreground"
                            />
                            {(sub.tags ?? []).map((t) => (
                              <span
                                key={t}
                                className={cn(
                                  "rounded-full border px-1.5 py-0 text-[9px] font-medium capitalize",
                                  TAG_COLORS[t] ??
                                    "bg-secondary text-foreground border-border",
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
                              onError: (err) =>
                                toast.error(err.message ?? "Failed to delete."),
                            })
                          }
                          className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-all mt-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meta */}
                <p className="mt-auto pt-2 text-[11px] text-muted-foreground">
                  Created <RelativeTime iso={task.createdAt} />
                  {task.reporterName ? ` by ${task.reporterName}` : ""}
                </p>
              </div>

              {/* ─── Right pane ─────────────────────────────────────────────── */}
              <div className="flex w-120 shrink-0 flex-col overflow-hidden bg-secondary/20">
                {/* Tabs header */}
                <div className="border-b border-border px-4 pt-3 pb-0 flex items-center gap-0">
                  {(["comments", "logs", "files"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-3 pb-2.5 pt-0.5 text-xs font-medium capitalize border-b-2 transition-colors cursor-pointer",
                        activeTab === tab
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground",
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
                    className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4"
                  >
                    {(() => {
                      const visibleFeed = activeTab === "comments"
                        ? feed
                            .filter((i) => i.type === "comment" || i.type === "file")
                            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        : feed
                            .filter((i) => i.type === "activity")
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                      if (visibleFeed.length === 0) {
                        return (
                          <p className="text-center text-xs text-muted-foreground py-4">
                            {activeTab === "comments"
                              ? "No comments yet."
                              : "No activity yet."}
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
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold mt-0.5",
                                  item.actorUserId === currentUserId
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-primary/10 text-primary",
                                )}
                              >
                                {getInitials(item.actorName)}
                              </div>

                              <div className="flex-1 min-w-0">
                                {/* Name + time + actions */}
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[11px] font-semibold text-foreground leading-none">
                                    {item.actorName ?? "Someone"}
                                  </span>
                                  <RelativeTime
                                    iso={item.createdAt}
                                    className="text-[10px] text-muted-foreground leading-none"
                                  />
                                  {item.updatedAt &&
                                    item.updatedAt !== item.createdAt && (
                                      <EditedBadge updatedAt={item.updatedAt} />
                                    )}
                                  {currentUserId &&
                                    item.authorId === currentUserId && (
                                      <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingCommentId(item.id);
                                            setEditingCommentBody(item.body ?? "");
                                            setEditingPendingAttachments([]);
                                            setEditingPendingAttachPreviews([]);
                                          }}
                                          className="flex h-5 w-5 items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        >
                                          <Pencil size={10} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            deleteComment.mutate(item.id, {
                                              onError: (err) =>
                                                toast.error(
                                                  err.message ??
                                                    "Failed to delete.",
                                                ),
                                            })
                                          }
                                          disabled={deleteComment.isPending}
                                          className="flex h-5 w-5 items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      </div>
                                    )}
                                </div>

                                {/* Body or edit mode */}
                                {editingCommentId === item.id ? (
                                  <div className="rounded-lg border border-ring/60 bg-background overflow-hidden shadow-sm">
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
                                        if (!editingCommentBody.trim() || updateComment.isPending) return;
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
                                    <div className="flex items-center justify-between border-t border-border/60 bg-secondary/20 px-2.5 py-1.5">
                                      <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              type="button"
                                              disabled={uploadAttachment.isPending}
                                              onClick={() => editAttachRef.current?.click()}
                                              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40 cursor-pointer"
                                            >
                                              <Paperclip size={11} />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top">Attach files (max 5 MB each)</TooltipContent>
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
                                              toast.error(`"${f.name}" exceeds 5 MB and was skipped.`);
                                              return false;
                                            }
                                            return true;
                                          });
                                          setEditingPendingAttachments((prev) => [...prev, ...valid]);
                                          valid.forEach((file, idx) => {
                                            if (file.type.startsWith("image/")) {
                                              const reader = new FileReader();
                                              reader.onload = (ev) =>
                                                setEditingPendingAttachPreviews((prev) => {
                                                  const next = [...prev];
                                                  next[editingPendingAttachments.length + idx] = ev.target?.result as string;
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
                                          className="rounded border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                                                toast.error(err instanceof Error ? err.message : "Upload failed.");
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
                                          disabled={(!editingCommentBody.trim() && editingPendingAttachments.length === 0) || updateComment.isPending || uploadAttachment.isPending}
                                          className="flex items-center gap-1 rounded bg-primary px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground disabled:opacity-50 transition-opacity cursor-pointer"
                                        >
                                          <Check size={10} /> {updateComment.isPending || uploadAttachment.isPending ? "Saving…" : "Save"}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Edit pending attachments preview */}
                                    {editingPendingAttachments.length > 0 && (
                                      <div className="flex flex-wrap gap-2 border-t border-border/60 bg-secondary/10 px-2.5 py-2">
                                        {editingPendingAttachments.map((file, idx) => (
                                          <div key={idx} className="relative flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 pr-6 max-w-[180px]">
                                            {editingPendingAttachPreviews[idx] ? (
                                              <img
                                                src={editingPendingAttachPreviews[idx]!}
                                                alt={file.name}
                                                className="h-6 w-6 rounded object-cover shrink-0"
                                              />
                                            ) : (
                                              <Paperclip size={11} className="shrink-0 text-muted-foreground" />
                                            )}
                                            <div className="min-w-0">
                                              <p className="truncate text-[10px] font-medium text-foreground">{file.name}</p>
                                              <p className="text-[9px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
                                                setEditingPendingAttachPreviews((prev) => prev.filter((_, i) => i !== idx));
                                              }}
                                              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-danger transition-colors cursor-pointer"
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
                                    className="text-xs text-foreground leading-relaxed prose prose-sm max-w-none [&_p]:my-0 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[11px]"
                                  />
                                )}
                              </div>
                            </div>
                          ) : item.type === "file" ? (
                            /* ── File upload ── */
                            <div className="flex gap-2.5">
                              <div
                                className={cn(
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold mt-0.5",
                                  item.actorUserId === currentUserId
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-primary/10 text-primary",
                                )}
                              >
                                {getInitials(item.actorName)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="text-[11px] font-semibold text-foreground leading-none">
                                    {item.actorName ?? "Someone"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground leading-none">
                                    attached a file
                                  </span>
                                  <RelativeTime
                                    iso={item.createdAt}
                                    className="text-[10px] text-muted-foreground/60 leading-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteAttachmentMutation.mutate(
                                        item.id.replace(/^file-/, ""),
                                        {
                                          onError: (err) =>
                                            toast.error(
                                              err.message ??
                                                "Failed to delete.",
                                            ),
                                        },
                                      )
                                    }
                                    disabled={
                                      deleteAttachmentMutation.isPending
                                    }
                                    className="ml-auto flex h-5 w-5 items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                                {(() => {
                                  const isImage =
                                    item.mimeType?.startsWith("image/");
                                  const canPreview = !!item.storageUrl;
                                  return (
                                    <div className="group/file relative overflow-hidden rounded-lg border border-border bg-card w-fit max-w-full">
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
                                            className="h-32 max-w-55 object-cover rounded-t-lg"
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/file:bg-black/25 transition-colors rounded-t-lg">
                                            <ZoomIn
                                              size={18}
                                              className="text-white opacity-0 group-hover/file:opacity-100 transition-opacity drop-shadow"
                                            />
                                          </div>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={!canPreview}
                                          className="relative h-16 w-full overflow-hidden group/thumb disabled:cursor-default cursor-pointer"
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
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/10 transition-colors cursor-pointer">
                                              <Eye
                                                size={13}
                                                className="text-current opacity-0 group-hover/thumb:opacity-60 transition-opacity drop-shadow"
                                              />
                                            </div>
                                          )}
                                        </button>
                                      )}
                                      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-t border-border/60">
                                        <div className="min-w-0">
                                          <p className="truncate text-[10px] font-medium text-foreground leading-tight max-w-40">
                                            {item.fileName}
                                          </p>
                                          {item.sizeBytes && (
                                            <p className="text-[9px] text-muted-foreground">
                                              {(item.sizeBytes / 1024).toFixed(
                                                0,
                                              )}{" "}
                                              KB
                                            </p>
                                          )}
                                        </div>
                                        <a
                                          href={item.storageUrl ?? "#"}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="shrink-0 flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
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
                              <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                                <span className="font-medium text-foreground/80">
                                  {item.actorName ?? "Someone"}
                                </span>{" "}
                                {formatActivityMessage(
                                  item.action ?? "",
                                  item.oldValues,
                                  item.newValues,
                                )}
                                <RelativeTime
                                  iso={item.createdAt}
                                  className="ml-1.5 text-[10px] text-muted-foreground/60"
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
                      <p className="text-xs font-medium text-muted-foreground">
                        {attachments.length > 0
                          ? `${attachments.length} file${attachments.length !== 1 ? "s" : ""}`
                          : "No files yet"}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadAttachment.isPending}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
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
                            onError: (err) =>
                              toast.error(err.message ?? "Upload failed."),
                          },
                        );
                        e.target.value = "";
                      }}
                    />
                    {attachments.length === 0 ? (
                      <div
                        className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border py-10 text-center cursor-pointer hover:border-foreground/30 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip
                          size={20}
                          className="text-muted-foreground/40"
                        />
                        <p className="text-xs text-muted-foreground">
                          Click to upload a file
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {attachments.map((att) => {
                          const isImage = att.mimeType?.startsWith("image/");
                          return (
                            <div
                              key={att.id}
                              className="group relative overflow-hidden rounded-card border border-border bg-card cursor-pointer"
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
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors">
                                    <ZoomIn
                                      size={16}
                                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
                                    />
                                  </div>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="relative h-20 w-full overflow-hidden group/thumb cursor-pointer"
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
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/10 transition-colors">
                                      <Eye
                                        size={15}
                                        className="text-current opacity-0 group-hover/thumb:opacity-60 transition-opacity drop-shadow"
                                      />
                                    </div>
                                  )}
                                </button>
                              )}
                              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                                <div className="min-w-0">
                                  <p className="truncate text-[10px] text-foreground leading-tight">
                                    {att.fileName}
                                  </p>
                                  {att.sizeBytes && (
                                    <p className="text-[9px] text-muted-foreground">
                                      {(att.sizeBytes / 1024).toFixed(0)} KB
                                    </p>
                                  )}
                                </div>
                                <a
                                  href={att.storageUrl ?? "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
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
                                      toast.error(
                                        err.message ??
                                          "Failed to delete attachment.",
                                      ),
                                  })
                                }
                                className="absolute right-1 top-1 rounded bg-card/80 p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-all cursor-pointer"
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
                  <div className="border-t border-border px-3 py-3">
                    <div className="rounded-lg border border-input bg-background overflow-hidden shadow-sm focus-within:border-ring/60 focus-within:ring-1 focus-within:ring-ring/20 transition-all">
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
                          !isCommentEmpty &&
                          !createComment.isPending &&
                          handleSubmitComment()
                        }
                        placeholder="Write a comment… (type @ to mention)"
                        className="text-sm"
                      />
                      <div className="flex items-center justify-between border-t border-border/60 bg-secondary/20 px-2.5 py-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground/50 select-none">
                            @ mention · Enter to post
                          </span>
                          <span className="text-[10px] text-muted-foreground/30 select-none">
                            ·
                          </span>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  disabled={uploadAttachment.isPending}
                                  onClick={() => commentAttachRef.current?.click()}
                                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40 cursor-pointer"
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
                                      next[pendingAttachments.length + idx] = ev.target?.result as string;
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
                          className="h-6 px-2.5 text-[11px] cursor-pointer gap-1"
                          disabled={(isCommentEmpty && pendingAttachments.length === 0) || createComment.isPending || uploadAttachment.isPending}
                          onClick={async () => {
                            if (pendingAttachments.length > 0) {
                              try {
                                for (const file of pendingAttachments) {
                                  await uploadAttachment.mutateAsync({ file });
                                }
                                toast.success(`${pendingAttachments.length} file${pendingAttachments.length > 1 ? "s" : ""} attached.`);
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
                          {createComment.isPending || uploadAttachment.isPending ? "Posting…" : "Post"}
                        </Button>
                      </div>

                      {/* Pending attachments preview */}
                      {pendingAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 border-t border-border/60 bg-secondary/10 px-2.5 py-2">
                          {pendingAttachments.map((file, idx) => (
                            <div key={idx} className="relative flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 pr-6 max-w-[180px]">
                              {pendingAttachPreviews[idx] ? (
                                <img
                                  src={pendingAttachPreviews[idx]!}
                                  alt={file.name}
                                  className="h-6 w-6 rounded object-cover shrink-0"
                                />
                              ) : (
                                <Paperclip size={11} className="shrink-0 text-muted-foreground" />
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-medium text-foreground">{file.name}</p>
                                <p className="text-[9px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
                                  setPendingAttachPreviews((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-danger transition-colors cursor-pointer"
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
          onLogged={() => {}}
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
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </Dialog>
  );
}
