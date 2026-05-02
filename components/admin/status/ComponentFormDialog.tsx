"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
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
import { componentFormSchema, type ComponentFormValues } from "@/schemas/admin/status-components";
import {
  createComponentAction,
  updateComponentAction,
} from "@/server/actions/admin/status-components";
import type { AdminStatusComponent } from "@/server/admin/status-components";
import type { ProbeConfig } from "@/db/schemas/status";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component?: AdminStatusComponent;
};

const PROBE_KIND_OPTIONS = [
  { value: "http", label: "HTTP probe (URL ping)" },
  { value: "stripe_balance", label: "Stripe balance (outbound)" },
  { value: "signal", label: "Signal heartbeat (indirect)" },
];

const HTTP_METHOD_OPTIONS = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
];

function defaultProbeConfig(kind: ProbeConfig["kind"]): ProbeConfig {
  if (kind === "http") {
    return { kind: "http", url: "", method: "GET", expectedStatus: 200 };
  }
  if (kind === "stripe_balance") {
    return { kind: "stripe_balance" };
  }
  return { kind: "signal", signalKey: "", staleAfterMin: 30 };
}

export function ComponentFormDialog({ open, onOpenChange, component }: Props) {
  const isEdit = !!component;
  const [isPending, startTransition] = useTransition();
  const [probeKind, setProbeKind] = useState<ProbeConfig["kind"]>(
    component?.probeConfig.kind ?? "http",
  );

  const form = useForm<ComponentFormValues>({
    // Cast matches the existing PlanFormDialog pattern: zodResolver returns
    // a generic Resolver<FieldValues> that TS can't unify with the discriminated
    // union ComponentFormValues without an explicit assertion.
    resolver: zodResolver(componentFormSchema) as Resolver<ComponentFormValues>,
    defaultValues: {
      slug: component?.slug ?? "",
      name: component?.name ?? "",
      description: component?.description ?? "",
      probeConfig: component?.probeConfig ?? defaultProbeConfig("http"),
      autoOpenIncidentAfterMin: component?.autoOpenIncidentAfterMin ?? undefined,
      displayOrder: component?.displayOrder ?? 0,
      isActive: component?.isActive ?? true,
    },
  });

  const { control, handleSubmit, reset, setValue, watch } = form;
  const watchKind = watch("probeConfig.kind");

  // When the user changes probe kind, swap in the default config for that
  // kind so old kind-specific fields don't leak in as undefined and break
  // the discriminated-union validator.
  useEffect(() => {
    if (watchKind !== probeKind) {
      setProbeKind(watchKind);
      setValue("probeConfig", defaultProbeConfig(watchKind));
    }
  }, [watchKind, probeKind, setValue]);

  const onSubmit: SubmitHandler<ComponentFormValues> = (values) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateComponentAction(component!.id, values)
        : await createComponentAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Component updated." : "Component created.");
      onOpenChange(false);
      reset();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit component" : "New status component"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormGrid cols={2}>
            <ControlledInput control={control} name="name" label="Name" placeholder="Public API" />
            <ControlledInput
              control={control}
              name="slug"
              label="Slug"
              placeholder="public-api"
              description="Lowercase, hyphenated. Used in incident URLs."
            />
          </FormGrid>

          <ControlledTextarea
            control={control}
            name="description"
            label="Description (optional)"
            placeholder="Customer-facing API endpoints under /api/v1."
          />

          <FormGrid cols={2}>
            <ControlledInput
              control={control}
              name="displayOrder"
              type="number"
              label="Display order"
              description="Lower numbers appear first."
            />
            <ControlledInput
              control={control}
              name="autoOpenIncidentAfterMin"
              type="number"
              label="Auto-open incident after (min)"
              description="Empty = disabled. Recommended: 5."
            />
          </FormGrid>

          {/* ── Probe config ──────────────────────────────────────────── */}
          <div className="border-border rounded-lg border p-4">
            <p className="text-foreground mb-3 text-sm font-semibold">Probe configuration</p>
            <ControlledSelect
              control={control}
              name="probeConfig.kind"
              label="Probe kind"
              options={PROBE_KIND_OPTIONS}
            />

            {watchKind === "http" && (
              <div className="mt-4 space-y-4">
                <ControlledInput
                  control={control}
                  name="probeConfig.url"
                  label="URL"
                  placeholder="{APP_URL}/api/health"
                  description="`{APP_URL}` expands to NEXT_PUBLIC_APP_URL at probe time."
                />
                <FormGrid cols={2}>
                  <ControlledSelect
                    control={control}
                    name="probeConfig.method"
                    label="Method"
                    options={HTTP_METHOD_OPTIONS}
                  />
                  <ControlledInput
                    control={control}
                    name="probeConfig.expectedStatus"
                    type="number"
                    label="Expected status"
                    description="200 normally; 400 for the webhook signature probe."
                  />
                </FormGrid>
                <FormGrid cols={2}>
                  <ControlledInput
                    control={control}
                    name="probeConfig.authHeader"
                    label="Auth header (optional)"
                    placeholder="X-API-Key"
                  />
                  <ControlledInput
                    control={control}
                    name="probeConfig.authValueEnv"
                    label="Auth value env var (optional)"
                    placeholder="STATUS_MONITORING_API_KEY"
                    description="Read from process.env at probe time."
                  />
                </FormGrid>
                <ControlledTextarea
                  control={control}
                  name="probeConfig.body"
                  label="Body (optional, POST only)"
                  placeholder=""
                />
              </div>
            )}

            {watchKind === "stripe_balance" && (
              <p className="text-muted-foreground mt-4 text-xs">
                Calls <code>stripe.balance.retrieve()</code> on each probe. Requires{" "}
                <code>STRIPE_SECRET_KEY</code> in env.
              </p>
            )}

            {watchKind === "signal" && (
              <div className="mt-4 space-y-4">
                <FormGrid cols={2}>
                  <ControlledInput
                    control={control}
                    name="probeConfig.signalKey"
                    label="Signal key"
                    placeholder="email_send_success"
                    description="Must match a key bumped from inside the app."
                  />
                  <ControlledInput
                    control={control}
                    name="probeConfig.staleAfterMin"
                    type="number"
                    label="Stale after (min)"
                    description="Probe fails if signal hasn't been observed in this many minutes."
                  />
                </FormGrid>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...form.register("isActive")}
              className="border-border rounded"
            />
            <span className="text-foreground">Active (probed and shown publicly)</span>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
