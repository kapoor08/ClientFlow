"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/form";
import { parseEstimate, minutesToEstimate } from "@/components/form";
import { http } from "@/core/infrastructure";

type TaskOption = { id: string; title: string };
type ProjectOption = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
  /**
   * Project context. Optional - when omitted, the dialog renders a project
   * picker (used by the standalone /time-tracking page where the user has
   * not navigated into a specific project).
   */
  projectId?: string;
  /** When set, task is pre-fixed (e.g. opened from TaskDetailSheet) */
  taskId?: string | null;
  taskTitle?: string | null;
};

export function LogTimeDialog({ open, onClose, onLogged, projectId, taskId, taskTitle }: Props) {
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [description, setDescription] = useState("");
  const [loggedAt, setLoggedAt] = useState<Date | undefined>(() => new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string>("none");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const parsedMinutes = parseEstimate(draft);
  const effectiveProjectId = projectId ?? selectedProjectId;

  // Project picker - only fetched when dialog is open and project not pre-set.
  const { data: projectsData } = useQuery({
    queryKey: ["projects-for-log"],
    queryFn: () => http<{ projects: ProjectOption[] }>(`/api/projects?pageSize=200`),
    enabled: open && !projectId,
    staleTime: 60 * 1000,
  });
  const projectOptions = projectsData?.projects ?? [];

  // Only fetch tasks when dialog is open, task is not pre-fixed, and we know
  // which project to scope by.
  const { data: tasksData } = useQuery({
    queryKey: ["project-tasks-for-log", effectiveProjectId],
    queryFn: () =>
      http<{ tasks: TaskOption[] }>(`/api/tasks?projectId=${effectiveProjectId}&pageSize=200`),
    enabled: open && !taskId && Boolean(effectiveProjectId),
    staleTime: 30 * 1000,
  });
  const taskOptions = tasksData?.tasks ?? [];

  function reset() {
    setDraft("");
    setInvalid(false);
    setDescription("");
    setLoggedAt(new Date());
    setSelectedTaskId("none");
    setSelectedProjectId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!parsedMinutes) {
      setInvalid(true);
      return;
    }

    if (!effectiveProjectId) {
      toast.error("Pick a project first.");
      return;
    }

    // Resolve which task ID to log against
    const resolvedTaskId = taskId ?? (selectedTaskId !== "none" ? selectedTaskId : null);

    setSaving(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: effectiveProjectId,
          taskId: resolvedTaskId,
          minutes: parsedMinutes,
          description: description.trim() || undefined,
          loggedAt: (loggedAt ?? new Date()).toISOString(),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to log time.");
      }

      toast.success(`${minutesToEstimate(parsedMinutes)} logged.`);
      reset();
      onLogged();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log time.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="text-muted-foreground h-4 w-4" />
            Log Time
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Time spent */}
          <div className="space-y-1.5">
            <Label htmlFor="lt-duration">Time spent *</Label>
            <Input
              id="lt-duration"
              autoFocus
              placeholder="e.g. 1h 30m, 2d, 45m"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setInvalid(false);
              }}
              className={invalid ? "border-destructive focus-visible:ring-destructive/30" : ""}
            />
            {invalid && (
              <p className="text-destructive text-xs">
                Use: 1w 2d 3h 30m (w=week, d=day, h=hour, m=min)
              </p>
            )}
            {parsedMinutes && !invalid && (
              <p className="text-muted-foreground text-xs">= {minutesToEstimate(parsedMinutes)}</p>
            )}
          </div>

          {/* Project - shown only when no project is pre-set */}
          {!projectId && (
            <div className="space-y-1.5">
              <Label>Project *</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  {projectOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Task - read-only if pre-fixed, selectable otherwise */}
          <div className="space-y-1.5">
            <Label>Task</Label>
            {taskId ? (
              <p className="text-foreground text-sm font-medium">{taskTitle ?? taskId}</p>
            ) : (
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select a task (optional)" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  <SelectItem value="none" className="cursor-pointer">
                    No task
                  </SelectItem>
                  {taskOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="cursor-pointer">
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <DatePicker value={loggedAt} onChange={setLoggedAt} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="lt-desc">Description (optional)</Label>
            <Textarea
              id="lt-desc"
              placeholder="What did you work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={saving}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="cursor-pointer">
              {saving ? "Saving…" : "Log Time"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
