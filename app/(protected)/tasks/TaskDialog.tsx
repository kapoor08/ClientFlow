"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taskFormSchema, type TaskFormValues, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/lib/tasks-shared";
import { useCreateTask, useUpdateTask, useDeleteTask } from "@/core/tasks/useCase";
import type { TaskListItem } from "@/core/tasks/entity";
import { http } from "@/core/infrastructure";

// ─── Data fetching for selects ─────────────────────────────────────────────────

function useProjectOptions() {
  return useQuery({
    queryKey: ["projects", "select-options"],
    queryFn: () =>
      http<{ projects: { id: string; name: string }[] }>(
        "/api/projects?pageSize=100",
      ).then((r) => r.projects ?? []),
    staleTime: 60 * 1000,
  });
}

function useTeamMemberOptions() {
  return useQuery({
    queryKey: ["team", "select-options"],
    queryFn: () =>
      http<{ members: { userId: string; name: string | null }[] }>(
        "/api/team",
      ).then((r) => r.members ?? []),
    staleTime: 60 * 1000,
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

type TaskDialogProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  task?: TaskListItem | null;
  defaultProjectId?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskDialog({
  open,
  onClose,
  mode,
  task,
  defaultProjectId,
}: TaskDialogProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const { data: projectOptions = [] } = useProjectOptions();
  const { data: memberOptions = [] } = useTeamMemberOptions();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(taskFormSchema) as any,
    defaultValues: {
      projectId: defaultProjectId ?? "",
      title: "",
      description: "",
      status: "todo",
      priority: null,
      assigneeUserId: null,
      dueDate: null,
      estimateMinutes: null,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && task) {
      reset({
        projectId: task.projectId,
        title: task.title,
        description: "",
        status: task.status as TaskFormValues["status"],
        priority: (task.priority as TaskFormValues["priority"]) ?? null,
        assigneeUserId: task.assigneeUserId ?? null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        estimateMinutes: task.estimateMinutes ?? null,
      });
    } else if (mode === "create") {
      reset({
        projectId: defaultProjectId ?? "",
        title: "",
        description: "",
        status: "todo",
        priority: null,
        assigneeUserId: null,
        dueDate: null,
        estimateMinutes: null,
      });
    }
  }, [mode, task, defaultProjectId, reset]);

  const isPending =
    isSubmitting || createTask.isPending || updateTask.isPending;

  async function onSubmit(values: TaskFormValues) {
    const payload = {
      ...values,
      dueDate: values.dueDate ? values.dueDate.toISOString() : null,
    };

    if (mode === "create") {
      await createTask.mutateAsync(payload);
    } else if (task) {
      await updateTask.mutateAsync({ taskId: task.id, data: payload });
    }
    onClose();
  }

  async function handleDelete() {
    if (!task) return;
    await deleteTask.mutateAsync({ taskId: task.id });
    onClose();
  }

  const watchedStatus = watch("status");
  const watchedPriority = watch("priority");
  const watchedProjectId = watch("projectId");
  const watchedAssignee = watch("assigneeUserId");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New Task" : "Edit Task"}
          </DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          {/* Project */}
          <div className="space-y-1.5">
            <Label>Project *</Label>
            <Select
              value={watchedProjectId}
              onValueChange={(v) => setValue("projectId", v)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project…" />
              </SelectTrigger>
              <SelectContent position="popper">
                {projectOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.projectId && (
              <p className="text-xs text-destructive">{errors.projectId.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Task title…"
              disabled={isPending}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Optional details…"
              disabled={isPending}
              rows={3}
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={watchedStatus}
                onValueChange={(v) =>
                  setValue("status", v as TaskFormValues["status"])
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {TASK_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={watchedPriority ?? "none"}
                onValueChange={(v) =>
                  setValue(
                    "priority",
                    v === "none" ? null : (v as TaskFormValues["priority"]),
                  )
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="none">None</SelectItem>
                  {TASK_PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select
                value={watchedAssignee ?? "unassigned"}
                onValueChange={(v) =>
                  setValue("assigneeUserId", v === "unassigned" ? null : v)
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {memberOptions.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name ?? m.userId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                disabled={isPending}
                onChange={(e) =>
                  setValue(
                    "dueDate",
                    e.target.value ? new Date(e.target.value) : null,
                  )
                }
                defaultValue={
                  task?.dueDate ? task.dueDate.slice(0, 10) : undefined
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {mode === "edit" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive cursor-pointer"
                disabled={deleteTask.isPending}
                onClick={handleDelete}
              >
                {deleteTask.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span className="ml-1.5">Delete</span>
              </Button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="cursor-pointer"
              >
                {isPending && (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                )}
                {mode === "create" ? "Create Task" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
