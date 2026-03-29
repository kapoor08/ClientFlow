"use client";

import { useState } from "react";
import { Trash2, Pencil, Copy, FolderKanban, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
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

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-500",
  high: "text-orange-500",
  medium: "text-amber-500",
  low: "text-muted-foreground",
};

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  template: TemplateItem;
  onEdit: (t: TemplateItem) => void;
  onDelete: (t: TemplateItem) => void;
  onDuplicate: (t: TemplateItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-card border border-border bg-card shadow-cf-1 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FolderKanban size={16} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{template.name}</p>
          {template.description && (
            <p className="text-xs text-muted-foreground truncate">{template.description}</p>
          )}
          <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>{template.tasks.length} task{template.tasks.length !== 1 ? "s" : ""}</span>
            <span>Default: {template.defaultStatus}</span>
            {template.defaultPriority && (
              <span className={PRIORITY_COLORS[template.defaultPriority] ?? ""}>{template.defaultPriority}</span>
            )}
            <span>Updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded((v) => !v)} title="Preview tasks">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(template)} title="Duplicate">
            <Copy size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(template)} title="Edit">
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => onDelete(template)} title="Delete">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {expanded && template.tasks.length > 0 && (
        <div className="border-t border-border divide-y divide-border bg-secondary/30">
          {template.tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-2.5">
              <span className="text-xs font-medium text-foreground">{task.title}</span>
              {task.priority && (
                <span className={`text-[10px] font-medium ${PRIORITY_COLORS[task.priority] ?? ""}`}>
                  {task.priority}
                </span>
              )}
              {task.dueDaysFromStart !== undefined && task.dueDaysFromStart > 0 && (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  Day +{task.dueDaysFromStart}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {expanded && template.tasks.length === 0 && (
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground bg-secondary/30">
          No tasks in this template.
        </div>
      )}
    </div>
  );
}
