"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ControlledInput, ControlledSelect } from "@/components/form";
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
  { value: "none", label: "No priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required."),
  description: z.string().optional(),
  defaultStatus: z.enum(["planning", "active", "on_hold"]),
  defaultPriority: z.enum(["none", "low", "medium", "high", "urgent"]),
  tasks: z.array(z.object({ title: z.string() })),
  newTaskTitle: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

export type TemplateFormProps = {
  open: boolean;
  initial?: TemplateItem | null;
  onClose: () => void;
  onSave: (data: Omit<TemplateItem, "id" | "createdAt" | "updatedAt">) => void;
  saving: boolean;
  error: string | null;
};

export function TemplateFormDialog({
  open,
  initial,
  onClose,
  onSave,
  saving,
  error,
}: TemplateFormProps) {
  const {
    control,
    handleSubmit,
    register,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      defaultStatus: "planning",
      defaultPriority: "none",
      tasks: [],
      newTaskTitle: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tasks",
  });

  // Sync form state when dialog opens or initial value changes
  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? "",
        description: initial?.description ?? "",
        defaultStatus:
          (initial?.defaultStatus as TemplateFormValues["defaultStatus"]) ??
          "planning",
        defaultPriority:
          (initial?.defaultPriority as TemplateFormValues["defaultPriority"]) ||
          "none",
        tasks: initial?.tasks ?? [],
        newTaskTitle: "",
      });
    }
  }, [open, initial, reset]);

  const newTaskTitle = watch("newTaskTitle") ?? "";

  function addTask() {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    append({ title: trimmed });
    setValue("newTaskTitle", "");
  }

  function onSubmit(values: TemplateFormValues) {
    onSave({
      name: values.name,
      description: values.description || null,
      defaultStatus: values.defaultStatus,
      defaultPriority:
        values.defaultPriority === "none" ? null : values.defaultPriority,
      tasks: values.tasks,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            Define a reusable project structure with predefined tasks.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <form
          id="template-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 py-2"
        >
          <ControlledInput
            name="name"
            label="Template Name*"
            control={control}
            error={errors.name}
            placeholder="e.g. Website Redesign"
          />

          <ControlledInput
            name="description"
            label="Description (optional)"
            control={control}
            error={errors.description}
            placeholder="Brief description"
          />

          <div className="grid grid-cols-2 gap-4">
            <ControlledSelect
              name="defaultStatus"
              label="Default Status*"
              control={control}
              options={STATUS_OPTIONS}
              error={errors.defaultStatus}
            />
            <ControlledSelect
              name="defaultPriority"
              label="Default Priority*"
              control={control}
              options={PRIORITY_OPTIONS}
              error={errors.defaultPriority}
            />
          </div>

          {/* Task list */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Tasks ({fields.length})</p>
            {fields.length > 0 && (
              <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {fields.map((field, i) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2"
                  >
                    <span className="flex-1 text-xs text-foreground">
                      {field.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="cursor-pointer text-muted-foreground hover:text-danger"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                {...register("newTaskTitle")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTask();
                  }
                }}
                placeholder="Add a task..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={addTask}
                disabled={!newTaskTitle.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" form="template-form" disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" /> Saving…
              </>
            ) : initial ? (
              "Save Changes"
            ) : (
              "Create Template"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
