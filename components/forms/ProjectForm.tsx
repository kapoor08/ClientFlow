"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import {
  projectFormSchema,
  getDefaultProjectFormValues,
  PROJECT_STATUS_OPTIONS,
  PROJECT_PRIORITY_OPTIONS,
  BUDGET_TYPE_OPTIONS,
  type ProjectFormValues,
} from "@/lib/projects-shared";
import { useCreateProject, useUpdateProject } from "@/core/projects";
import { ControlledInput } from "@/components/form/ControlledInput";
import { ControlledSelect } from "@/components/form/ControlledSelect";
import { ControlledTextarea } from "@/components/form/ControlledTextarea";
import { ControlledDatePicker } from "@/components/form/ControlledDatePicker";
import { FormSection } from "@/components/form/FormSection";
import { FormGrid } from "@/components/form/FormGrid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ClientOption = { value: string; label: string };

type ProjectFormProps = {
  mode: "create" | "edit";
  projectId?: string;
  submitLabel?: string;
  initialValues?: ProjectFormValues;
  clients: ClientOption[];
};

const statusOptions = PROJECT_STATUS_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

const priorityOptions = PROJECT_PRIORITY_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

// Next.js serializes Date objects to ISO strings when passing server→client.
// This restores them to proper Date instances so Zod validation passes.
function normalizeInitialValues(values: ProjectFormValues): ProjectFormValues {
  return {
    ...values,
    startDate: values.startDate
      ? new Date(values.startDate as unknown as string)
      : null,
    dueDate: values.dueDate
      ? new Date(values.dueDate as unknown as string)
      : null,
  };
}

export function ProjectForm({
  mode,
  projectId,
  submitLabel = "Save",
  initialValues,
  clients,
}: ProjectFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const isPending = createProject.isPending || updateProject.isPending;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    mode: "onBlur",
    defaultValues: initialValues
      ? normalizeInitialValues(initialValues)
      : getDefaultProjectFormValues(),
  });

  const selectedBudgetType = useWatch({ control, name: "budgetType" });
  const budgetTypeOption = BUDGET_TYPE_OPTIONS.find(
    (o) => o.value === selectedBudgetType,
  );

  async function onSubmit(values: ProjectFormValues) {
    setServerError(null);
    try {
      if (mode === "create") {
        const res = await createProject.mutateAsync(values);
        toast.success("Project created.");
        router.push(`/projects/${res.projectId}`);
        router.refresh();
      } else {
        await updateProject.mutateAsync({
          projectId: projectId!,
          data: values,
        });
        toast.success("Project updated.");
        router.push(`/projects/${projectId}`);
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setServerError(message);
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError ? (
        <div className="rounded-card border border-error-border bg-error-surface px-4 py-3 text-sm text-error">
          {serverError}
        </div>
      ) : null}

      {/* Project Details */}
      <FormSection
        title="Project Details"
        description="Basic information about this project."
      >
        <FormGrid cols={2}>
          <ControlledInput
            name="name"
            label="Project Name*"
            control={control}
            error={errors.name}
            placeholder="e.g. Website Redesign"
            disabled={isPending}
          />
          <ControlledSelect
            name="clientId"
            label="Client*"
            control={control}
            error={errors.clientId}
            options={clients}
            placeholder="Select a client"
            disabled={isPending}
          />
          <ControlledSelect
            name="status"
            label="Status*"
            control={control}
            error={errors.status}
            options={statusOptions}
            disabled={isPending}
          />
          <ControlledSelect
            name="priority"
            label="Priority*"
            control={control}
            error={errors.priority}
            options={priorityOptions}
            disabled={isPending}
          />
        </FormGrid>
      </FormSection>

      {/* Timeline */}
      <FormSection
        title="Timeline"
        description="Set the project start and due dates."
      >
        <FormGrid cols={2}>
          <ControlledDatePicker
            name="startDate"
            label="Start Date"
            control={control}
            error={errors.startDate}
            placeholder="Pick a start date"
            position="bottom"
            disabled={isPending}
          />
          <ControlledDatePicker
            name="dueDate"
            label="Due Date"
            control={control}
            error={errors.dueDate}
            placeholder="Pick a due date"
            position="bottom"
            disabled={isPending}
          />
        </FormGrid>
      </FormSection>

      {/* Budget */}
      <FormSection
        title="Budget"
        description="Choose a billing model and optionally set an amount."
      >
        {/* Budget type cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {BUDGET_TYPE_OPTIONS.map((opt) => {
            const isSelected = selectedBudgetType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (isSelected) {
                    setValue("budgetType", "", { shouldValidate: true });
                    setValue("budget", "", { shouldValidate: false });
                  } else {
                    setValue("budgetType", opt.value, { shouldValidate: true });
                  }
                }}
                className={cn(
                  "flex flex-col gap-0.5 rounded-card border p-4 text-left transition-all cursor-pointer",
                  "hover:border-primary/40 hover:bg-primary/10",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card",
                  isPending && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="text-sm font-medium text-foreground">
                  {opt.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Amount field — shown only when a budget type is selected */}
        {budgetTypeOption && (
          <div className="mt-4 max-w-xs">
            <ControlledInput
              name="budget"
              label={budgetTypeOption.amountLabel}
              control={control}
              type="text"
              inputMode="decimal"
              placeholder={budgetTypeOption.placeholder}
              error={errors.budget}
              disabled={isPending}
            />
          </div>
        )}
      </FormSection>

      {/* Description */}
      <FormSection
        title="Description"
        description="A brief overview of the project scope and goals."
      >
        <ControlledTextarea
          name="description"
          control={control}
          error={errors.description}
          rows={4}
          placeholder="Describe the project scope, goals, and deliverables…"
          disabled={isPending}
        />
      </FormSection>

      {/* Actions */}
      <div>
        <Button type="submit" disabled={isPending} className="cursor-pointer">
          <Save size={14} className="mr-1.5" />
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
