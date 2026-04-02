"use client";

import { useState } from "react";
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
import { DatePicker } from "@/components/form/DatePicker";

type Props = {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
  projectId: string;
  taskId?: string | null;
  taskTitle?: string | null;
};

/**
 * Parses a human-readable duration string into minutes.
 * Supports: "2h", "30m", "1h 30m", "90", "1.5h"
 */
function parseDuration(raw: string): number | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  // Plain number → treat as minutes
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const v = parseFloat(trimmed);
    return v > 0 ? Math.round(v) : null;
  }

  let total = 0;
  // Match patterns like 2h, 30m, 1.5h, 2h30m, 2h 30m
  const hourMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*m(?!o)/);

  if (hourMatch) total += parseFloat(hourMatch[1]) * 60;
  if (minMatch) total += parseFloat(minMatch[1]);

  return total > 0 ? Math.round(total) : null;
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function LogTimeDialog({
  open,
  onClose,
  onLogged,
  projectId,
  taskId,
  taskTitle,
}: Props) {
  const [durationRaw, setDurationRaw] = useState("");
  const [description, setDescription] = useState("");
  const [loggedAt, setLoggedAt] = useState<Date | undefined>(() => new Date());
  const [saving, setSaving] = useState(false);
  const [parseError, setParseError] = useState(false);

  const parsedMinutes = parseDuration(durationRaw);

  function handleDurationChange(v: string) {
    setDurationRaw(v);
    setParseError(false);
  }

  function reset() {
    setDurationRaw("");
    setDescription("");
    setLoggedAt(new Date());
    setParseError(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!parsedMinutes) {
      setParseError(true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          taskId: taskId ?? null,
          minutes: parsedMinutes,
          description: description.trim() || undefined,
          loggedAt: (loggedAt ?? new Date()).toISOString(),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to log time.");
      }

      toast.success(`${formatMinutes(parsedMinutes)} logged.`);
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Log Time
          </DialogTitle>
        </DialogHeader>

        {taskTitle && (
          <p className="text-xs text-muted-foreground -mt-2">
            On: <span className="font-medium text-foreground">{taskTitle}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="lt-duration">Time spent *</Label>
            <Input
              id="lt-duration"
              placeholder="e.g. 2h 30m, 90m, 1.5h"
              value={durationRaw}
              onChange={(e) => handleDurationChange(e.target.value)}
              className={parseError ? "border-destructive" : ""}
              autoFocus
            />
            {parseError && (
              <p className="text-xs text-destructive">
                Use: 2h, 30m, 1h 30m, or 90 (minutes)
              </p>
            )}
            {parsedMinutes && !parseError && (
              <p className="text-xs text-muted-foreground">
                = {formatMinutes(parsedMinutes)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Date</Label>
            <DatePicker value={loggedAt} onChange={setLoggedAt} />
          </div>

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
              onClick={onClose}
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
