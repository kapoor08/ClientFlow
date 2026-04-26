"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { http } from "@/core/infrastructure";
import { useUpdateTask } from "@/core/tasks/useCase";

type ProjectOption = { id: string; name: string };

type TaskRef = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  assigneeUserId: string | null;
  dueDate: string | null;
  estimateMinutes: number | null;
  columnId: string | null;
  projectId: string;
  tags: string[];
};

type MoveToProjectDialogProps = {
  open: boolean;
  task: TaskRef | null;
  onClose: () => void;
};

export function MoveToProjectDialog({ open, task, onClose }: MoveToProjectDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const updateTask = useUpdateTask();

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list-move"],
    queryFn: () => http<{ projects: ProjectOption[] }>("/api/projects?pageSize=100"),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const projects = projectsData?.projects ?? [];

  function handleMove() {
    if (!task || !selectedProjectId) return;
    updateTask.mutate(
      {
        taskId: task.id,
        data: {
          projectId: selectedProjectId,
          title: task.title,
          description: "",
          status: task.status,
          priority: task.priority ?? null,
          assigneeUserId: task.assigneeUserId ?? null,
          dueDate: task.dueDate ?? null,
          estimateMinutes: task.estimateMinutes ?? null,
          columnId: task.columnId ?? null,
          tags: task.tags ?? [],
        },
      },
      {
        onSuccess: () => {
          toast.success("Task moved to project.");
          setSelectedProjectId("");
          onClose();
        },
        onError: (err) => toast.error(err.message ?? "Failed to move task."),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setSelectedProjectId("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Move to Project</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-sm">
          Select a project to move{" "}
          <span className="text-foreground font-medium">&quot;{task?.title}&quot;</span> to.
        </p>

        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Project
          </p>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Select a project…" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter showCloseButton={false}>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedProjectId("");
              onClose();
            }}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedProjectId || updateTask.isPending}
            className="cursor-pointer"
          >
            {updateTask.isPending ? "Moving…" : "Move Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
