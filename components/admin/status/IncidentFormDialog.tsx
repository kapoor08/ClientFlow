"use client";

import { useTransition } from "react";
import { useForm, Controller, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ControlledInput, ControlledTextarea, ControlledSelect, FormGrid } from "@/components/form";
import { toast } from "sonner";
import {
  createIncidentSchema,
  INCIDENT_STATES,
  INCIDENT_IMPACTS,
  type CreateIncidentValues,
} from "@/schemas/admin/status-incidents";
import { createIncidentAction } from "@/server/actions/admin/status-incidents";
import type { AdminStatusComponent } from "@/server/admin/status-components";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: AdminStatusComponent[];
};

const STATE_OPTIONS = INCIDENT_STATES.filter((s) => s !== "resolved").map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

const IMPACT_OPTIONS = INCIDENT_IMPACTS.map((i) => ({
  value: i,
  label: i.charAt(0).toUpperCase() + i.slice(1),
}));

export function IncidentFormDialog({ open, onOpenChange, components }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateIncidentValues>({
    resolver: zodResolver(createIncidentSchema) as Resolver<CreateIncidentValues>,
    defaultValues: {
      title: "",
      impact: "minor",
      initialState: "investigating",
      initialBody: "",
      componentIds: [],
      isScheduled: false,
      scheduledFor: null,
      scheduledUntil: null,
    },
  });

  const { control, handleSubmit, reset, watch, register } = form;
  const isScheduled = watch("isScheduled");

  const onSubmit: SubmitHandler<CreateIncidentValues> = (values) => {
    startTransition(async () => {
      const result = await createIncidentAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Incident opened.");
      onOpenChange(false);
      reset();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Open new incident</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <ControlledInput
            control={control}
            name="title"
            label="Title"
            placeholder="Elevated API latency"
          />

          <FormGrid cols={2}>
            <ControlledSelect
              control={control}
              name="impact"
              label="Impact"
              options={IMPACT_OPTIONS}
            />
            <ControlledSelect
              control={control}
              name="initialState"
              label="Initial state"
              options={STATE_OPTIONS}
            />
          </FormGrid>

          <ControlledTextarea
            control={control}
            name="initialBody"
            label="Initial update"
            placeholder="We're aware of elevated API latency and are investigating."
          />

          {/* ── Affected components ───────────────────────────────────── */}
          <div>
            <p className="text-foreground mb-2 text-sm font-medium">Affected components</p>
            <Controller
              control={control}
              name="componentIds"
              render={({ field, fieldState }) => (
                <>
                  <div className="border-border bg-card max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                    {components.length === 0 ? (
                      <p className="text-muted-foreground text-xs">
                        No components configured. Create one first.
                      </p>
                    ) : (
                      components.map((c) => {
                        const checked = field.value.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              className="border-border rounded"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, c.id]);
                                } else {
                                  field.onChange(field.value.filter((id: string) => id !== c.id));
                                }
                              }}
                            />
                            <span className="text-foreground">{c.name}</span>
                            <span className="text-muted-foreground font-mono text-xs">
                              {c.slug}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  {fieldState.error && (
                    <p className="text-destructive mt-1 text-xs">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          {/* ── Scheduled maintenance toggle ──────────────────────────── */}
          <div className="border-border space-y-3 rounded-lg border p-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("isScheduled")}
                className="border-border rounded"
              />
              <span className="text-foreground font-medium">This is scheduled maintenance</span>
            </label>
            {isScheduled && (
              <FormGrid cols={2}>
                <ControlledInput
                  control={control}
                  name="scheduledFor"
                  type="datetime-local"
                  label="Start"
                />
                <ControlledInput
                  control={control}
                  name="scheduledUntil"
                  type="datetime-local"
                  label="End"
                />
              </FormGrid>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Opening..." : "Open incident"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
