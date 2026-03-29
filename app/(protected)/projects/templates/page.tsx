"use client";

import { useState } from "react";
import { Plus, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ProjectTemplateTask } from "@/lib/project-templates";
import { TemplateCard } from "./TemplateCard";
import { TemplateFormDialog } from "./TemplateFormDialog";

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

export default function ProjectTemplatesPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TemplateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ templates: TemplateItem[] }>({
    queryKey: ["project-templates"],
    queryFn: () => fetch("/api/project-templates").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (body: Omit<TemplateItem, "id" | "createdAt" | "updatedAt">) =>
      fetch("/api/project-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (res) => {
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error((d as { error?: string }).error ?? "Failed."); }
        return res.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-templates"] });
      setCreateOpen(false);
      setFormError(null);
      toast.success("Template created.");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to create template.";
      setFormError(message);
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Omit<TemplateItem, "id" | "createdAt" | "updatedAt">) =>
      fetch(`/api/project-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-templates"] });
      setEditTarget(null);
      setFormError(null);
      toast.success("Template updated.");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to update template.";
      setFormError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/project-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-templates"] });
      setDeleteTarget(null);
      toast.success("Template deleted.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete template."),
  });

  const templates = data?.templates ?? [];

  function handleDuplicate(template: TemplateItem) {
    createMutation.mutate({
      name: `${template.name} (Copy)`,
      description: template.description,
      defaultStatus: template.defaultStatus,
      defaultPriority: template.defaultPriority,
      tasks: template.tasks,
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Project Templates</h1>
          <p className="text-sm text-muted-foreground">
            Reusable project structures to speed up project creation.
          </p>
        </div>
        <Button size="sm" onClick={() => { setFormError(null); setCreateOpen(true); }}>
          <Plus size={14} className="mr-1.5" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-card border border-border bg-card p-5 shadow-cf-1">
              <div className="h-3 w-48 animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-card py-16 text-center shadow-cf-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <FolderKanban size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No templates yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a template to quickly set up new projects with predefined tasks.
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-1.5" /> Create Template
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={(t) => { setFormError(null); setEditTarget(t); }}
              onDelete={setDeleteTarget}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <TemplateFormDialog
        open={createOpen}
        onClose={() => { setCreateOpen(false); setFormError(null); }}
        onSave={(data) => createMutation.mutate(data)}
        saving={createMutation.isPending}
        error={formError}
      />

      {/* Edit dialog */}
      {editTarget && (
        <TemplateFormDialog
          open={!!editTarget}
          initial={editTarget}
          onClose={() => { setEditTarget(null); setFormError(null); }}
          onSave={(data) => updateMutation.mutate({ id: editTarget.id, ...data })}
          saving={updateMutation.isPending}
          error={formError}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
