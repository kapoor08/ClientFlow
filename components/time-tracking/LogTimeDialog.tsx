"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { toast } from "sonner";
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
import { DatePicker } from "@/components/form/DatePicker";
import { parseEstimate, minutesToEstimate } from "@/components/form/TimeEstimateInput";
import { http } from "@/core/infrastructure";

type TaskOption = { id: string; title: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
  projectId: string;
  /** When set, task is pre-fixed (e.g. opened from TaskDetailSheet) */
  taskId?: string | null;
  taskTitle?: string | null;
};

export function LogTimeDialog({
  open,
  onClose,
  onLogged,
  projectId,
  taskId,
  taskTitle,
}: Props) {
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [description, setDescription] = useState("");
  const [loggedAt, setLoggedAt] = useState<Date | undefined>(() => new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string>("none");
  const [saving, setSaving] = useState(false);

  const parsedMinutes = parseEstimate(draft);

  // Only fetch tasks when dialog is open and task is not pre-fixed
  const { data: tasksData } = useQuery({
    queryKey: ["project-tasks-for-log", projectId],
    queryFn: () =>
      http<{ tasks: TaskOption[] }>(`/api/tasks?projectId=${projectId}&pageSize=200`),
    enabled: open && !taskId,
    staleTime: 30 * 1000,
  });
  const taskOptions = tasksData?.tasks ?? [];

  function reset() {
    setDraft("");
    setInvalid(false);
    setDescription("");
    setLoggedAt(new Date());
    setSelectedTaskId("none");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!parsedMinutes) {
      setInvalid(true);
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
          projectId,
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
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
              onChange={(e) => { setDraft(e.target.value); setInvalid(false); }}
              className={invalid ? "border-destructive focus-visible:ring-destructive/30" : ""}
            />
            {invalid && (
              <p className="text-xs text-destructive">
                Use: 1w 2d 3h 30m (w=week, d=day, h=hour, m=min)
              </p>
            )}
            {parsedMinutes && !invalid && (
              <p className="text-xs text-muted-foreground">= {minutesToEstimate(parsedMinutes)}</p>
            )}
          </div>

          {/* Task - read-only if pre-fixed, selectable otherwise */}
          <div className="space-y-1.5">
            <Label>Task</Label>
            {taskId ? (
              <p className="text-sm font-medium text-foreground">
                {taskTitle ?? taskId}
              </p>
            ) : (
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Select a task (optional)" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  <SelectItem value="none" className="cursor-pointer">No task</SelectItem>
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
              onClick={() => { reset(); onClose(); }}
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
