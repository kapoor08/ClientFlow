"use client";

import { useRef, useState } from "react";
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
import { useCreateTask } from "@/core/tasks/useCase";
import { http } from "@/core/infrastructure";
import { CalendarDays, ChevronDown, User } from "lucide-react";

type CreateTaskDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultColumnId?: string;
  defaultColumnName?: string;
  defaultColumnColor?: string;
  parentTaskId?: string;
  defaultProjectId?: string;
  onCreated?: () => void;
};

type ProjectOption = { id: string; name: string };
type MemberOption = { userId: string; name: string; email: string };

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent", color: "#ef4444" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "low", label: "Low", color: "#71717a" },
];

export function CreateTaskDialog({
  open,
  onClose,
  defaultColumnId,
  defaultColumnName,
  defaultColumnColor,
  parentTaskId,
  defaultProjectId,
  onCreated,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "");
  const [assigneeUserId, setAssigneeUserId] = useState<string | null>(null);
  const [assigneeName, setAssigneeName] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>("");
  const [priority, setPriority] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  const createTask = useCreateTask();

  const { data: projectsData } = useQuery({
    queryKey: ["projects-create-task-list"],
    queryFn: () =>
      http<{ projects: ProjectOption[] }>("/api/projects?pageSize=100"),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const { data: teamData } = useQuery({
    queryKey: ["team-create-task-list"],
    queryFn: () =>
      http<{ members: MemberOption[] }>("/api/team").then((r) => ({
        members: r.members ?? [],
      })),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const projects = projectsData?.projects ?? [];
  const allMembers = teamData?.members ?? [];
  const filteredMembers = memberSearch
    ? allMembers.filter(
        (m) =>
          (m.name ?? "").toLowerCase().includes(memberSearch.toLowerCase()) ||
          (m.email ?? "").toLowerCase().includes(memberSearch.toLowerCase()),
      )
    : allMembers;

  function handleClose() {
    setTitle("");
    setDescription("");
    setProjectId(defaultProjectId ?? "");
    setAssigneeUserId(null);
    setAssigneeName(null);
    setDueDate("");
    setPriority(null);
    setMemberSearch("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Task title is required.");
      return;
    }

    if (!projectId) {
      toast.error("Please select a project.");
      return;
    }

    createTask.mutate(
      {
        title: trimmedTitle,
        description: description.trim() || undefined,
        projectId,
        status: "todo",
        priority: priority ?? undefined,
        assigneeUserId: assigneeUserId ?? undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        columnId: defaultColumnId ?? null,
        parentTaskId: parentTaskId ?? null,
      },
      {
        onSuccess: () => {
          toast.success(parentTaskId ? "Subtask created." : "Task created.");
          onCreated?.();
          handleClose();
        },
        onError: (err) => {
          toast.error(err.message ?? "Failed to create task.");
        },
      },
    );
  }

  const columnColor = defaultColumnColor ?? "#3b82f6";
  const columnName = defaultColumnName ?? "To Do";

  const selectedPriorityOpt = PRIORITY_OPTIONS.find(
    (o) => o.value === priority,
  );
  const assigneeInitials = assigneeName
    ? assigneeName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Create a new task</DialogTitle>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: columnColor }}
            >
              {columnName}
            </span>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {/* Task Name */}
          <Input
            ref={titleRef}
            autoFocus
            placeholder="Task name…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-medium"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description (optional)…"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />

          {/* Footer row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Project select */}
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-8 w-auto min-w-32 text-xs cursor-pointer">
                <SelectValue placeholder="Select project…" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Assignee */}
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild className="cursor-pointer">
                <button
                  type="button"
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-secondary",
                    assigneeUserId
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {assigneeInitials ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-primary cursor-pointer">
                      {assigneeInitials}
                    </div>
                  ) : (
                    <User size={13} />
                  )}
                  <span>{assigneeName ?? "Assignee"}</span>
                  <ChevronDown size={12} className="text-muted-foreground" />
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
                  {/* Unassign option */}
                  {assigneeUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssigneeUserId(null);
                        setAssigneeName(null);
                        setAssigneeOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary"
                    >
                      <User size={14} /> Unassign
                    </button>
                  )}
                  {filteredMembers.map((m) => {
                    const initials = (m.name ?? "?")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => {
                          setAssigneeUserId(m.userId);
                          setAssigneeName(m.name);
                          setAssigneeOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
                          assigneeUserId === m.userId
                            ? "bg-secondary text-foreground font-medium"
                            : "hover:bg-secondary/50 text-muted-foreground",
                        )}
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-primary">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-foreground">{m.name}</p>
                          <p className="truncate text-muted-foreground">
                            {m.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Due Date */}
            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-secondary",
                    dueDate
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  <CalendarDays size={13} />
                  <span>
                    {dueDate
                      ? new Date(dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "Due date"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Due date
                </p>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    setDueDateOpen(false);
                  }}
                  className="block rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setDueDate("");
                      setDueDateOpen(false);
                    }}
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear date
                  </button>
                )}
              </PopoverContent>
            </Popover>

            {/* Priority */}
            <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-secondary",
                    priority
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {selectedPriorityOpt ? (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: selectedPriorityOpt.color }}
                    />
                  ) : (
                    <span className="h-2 w-2 rounded-full border border-muted-foreground" />
                  )}
                  <span>{selectedPriorityOpt?.label ?? "Priority"}</span>
                  <ChevronDown size={12} className="text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1" align="start">
                {priority && (
                  <button
                    type="button"
                    onClick={() => {
                      setPriority(null);
                      setPriorityOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary"
                  >
                    <span className="h-2 w-2 rounded-full border border-muted-foreground" />
                    None
                  </button>
                )}
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setPriority(opt.value);
                      setPriorityOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
                      priority === opt.value
                        ? "bg-secondary text-foreground font-medium"
                        : "hover:bg-secondary/50 text-muted-foreground",
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                    {opt.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Spacer + action buttons */}
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createTask.isPending}>
                {createTask.isPending ? "Creating…" : "Create Task"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
