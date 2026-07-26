"use client";

import { useState } from "react";
import { Plus, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { toast } from "sonner";
import { TemplateCard, TemplateFormDialog } from "@/components/projects";
import { EmptyState } from "@/components/shared";
import type { ProjectTemplate } from "@/core/project-templates/entity";
import {
  useProjectTemplates,
  useCreateProjectTemplate,
  useUpdateProjectTemplate,
  useDeleteProjectTemplate,
} from "@/core/project-templates/useCase";

export default function ProjectTemplatesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectTemplate | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useProjectTemplates();
  const createMutation = useCreateProjectTemplate();
  const updateMutation = useUpdateProjectTemplate();
  const deleteMutation = useDeleteProjectTemplate();

  const templates = data?.templates ?? [];

  function handleCreate(input: Parameters<typeof createMutation.mutate>[0]) {
    createMutation.mutate(input, {
      onSuccess: () => {
        setCreateOpen(false);
        setFormError(null);
        toast.success("Template created.");
      },
      onError: (err) => {
        setFormError(err.message);
        toast.error(err.message);
      },
    });
  }

  function handleUpdate(id: string, input: Parameters<typeof createMutation.mutate>[0]) {
    updateMutation.mutate(
      { id, data: input },
      {
        onSuccess: () => {
          setEditTarget(null);
          setFormError(null);
          toast.success("Template updated.");
        },
        onError: (err) => {
          setFormError(err.message);
          toast.error(err.message);
        },
      },
    );
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success("Template deleted.");
      },
      onError: (err) => toast.error(err.message),
    });
  }

  function handleDuplicate(template: ProjectTemplate) {
    handleCreate({
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
          <h1 className="font-display text-foreground text-2xl font-semibold">Project Templates</h1>
          <p className="text-muted-foreground text-sm">
            Reusable project structures to speed up project creation.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setFormError(null);
            setCreateOpen(true);
          }}
          className="cursor-pointer"
        >
          <Plus size={14} /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-card border-border bg-card shadow-cf-1 border p-5">
              <div className="bg-secondary h-3 w-48 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No templates yet"
          description="Create a template to quickly set up new projects with predefined tasks."
          action={
            <Button size="sm" className="cursor-pointer" onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> Create Template
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={(t) => {
                setFormError(null);
                setEditTarget(t);
              }}
              onDelete={setDeleteTarget}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <TemplateFormDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setFormError(null);
        }}
        onSave={handleCreate}
        saving={createMutation.isPending}
        error={formError}
      />

      {/* Edit dialog */}
      {editTarget && (
        <TemplateFormDialog
          open={!!editTarget}
          initial={editTarget}
          onClose={() => {
            setEditTarget(null);
            setFormError(null);
          }}
          onSave={(data) => handleUpdate(editTarget.id, data)}
          saving={updateMutation.isPending}
          error={formError}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        title="Delete template?"
        description={
          <>
            <strong>{deleteTarget?.name}</strong> will be permanently deleted.
          </>
        }
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </div>
  );
}
