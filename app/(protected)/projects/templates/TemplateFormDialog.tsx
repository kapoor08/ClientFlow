"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectTemplateTask } from "@/lib/project-templates";

type TemplateItem = {
  id: string;
  name: string;
  description: string | null;
  defaultStatus: string;
  defaultPriority: string | null;
  tasks: ProjectTemplateTask[];
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "No priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export type TemplateFormProps = {
  open: boolean;
  initial?: TemplateItem | null;
  onClose: () => void;
  onSave: (data: Omit<TemplateItem, "id" | "createdAt" | "updatedAt">) => void;
  saving: boolean;
  error: string | null;
};

export function TemplateFormDialog({ open, initial, onClose, onSave, saving, error }: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [defaultStatus, setDefaultStatus] = useState(initial?.defaultStatus ?? "planning");
  const [defaultPriority, setDefaultPriority] = useState(initial?.defaultPriority ?? "");
  const [taskDrafts, setTaskDrafts] = useState<ProjectTemplateTask[]>(initial?.tasks ?? []);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  function addTask() {
    if (!newTaskTitle.trim()) return;
    setTaskDrafts((prev) => [...prev, { title: newTaskTitle.trim() }]);
    setNewTaskTitle("");
  }

  function removeTask(index: number) {
    setTaskDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Template" : "Create Template"}</DialogTitle>
          <DialogDescription>
            Define a reusable project structure with predefined tasks.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tpl-name">Template Name</Label>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Redesign" autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-desc">Description (optional)</Label>
            <Input id="tpl-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Status</Label>
              <Select value={defaultStatus} onValueChange={setDefaultStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Priority</Label>
              <Select value={defaultPriority} onValueChange={setDefaultPriority}>
                <SelectTrigger><SelectValue placeholder="No priority" /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task list */}
          <div className="space-y-2">
            <Label>Tasks ({taskDrafts.length})</Label>
            {taskDrafts.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {taskDrafts.map((task, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2">
                    <span className="flex-1 text-xs text-foreground">{task.title}</span>
                    <button onClick={() => removeTask(i)} className="text-muted-foreground hover:text-danger">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="Add a task..."
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={addTask} disabled={!newTaskTitle.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave({ name, description: description || null, defaultStatus, defaultPriority: defaultPriority || null, tasks: taskDrafts })}
            disabled={!name.trim() || saving}
          >
            {saving ? <><Loader2 size={14} className="mr-1.5 animate-spin" /> Saving…</> : initial ? "Save Changes" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
