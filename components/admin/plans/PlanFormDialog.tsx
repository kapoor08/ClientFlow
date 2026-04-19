"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { createPlanSchema, planFormSchema, type CreatePlanValues, type PlanFormValues } from "@/schemas/admin/plans";
import { createPlanAction, updatePlanAction } from "@/server/actions/admin/plans";
import type { getAdminPlansWithLimits } from "@/server/admin/plans";

type PlanRow = Awaited<ReturnType<typeof getAdminPlansWithLimits>>[number];

const BADGE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "popular", label: "Popular" },
  { value: "enterprise", label: "Enterprise" },
];

// Converts DB value ("" | "popular" | "enterprise") → select sentinel
function toSelectBadge(v: string | null | undefined): "" | "popular" | "enterprise" | "none" {
  if (v === "popular" || v === "enterprise") return v;
  return "none";
}

// Converts select sentinel → DB value
function fromSelectBadge(v: string | null | undefined): "popular" | "enterprise" | "" {
  if (!v || v === "none") return "";
  return v as "popular" | "enterprise";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: PlanRow;
};

export function PlanFormDialog({ open, onOpenChange, plan }: Props) {
  const isEdit = !!plan;
  const [isPending, startTransition] = useTransition();
  const [featuresText, setFeaturesText] = useState<string>(
    (plan?.features ?? []).join("\n"),
  );

  const schema = isEdit ? planFormSchema : createPlanSchema;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePlanValues>({
    resolver: zodResolver(schema as typeof createPlanSchema) as Resolver<CreatePlanValues>,
    defaultValues: {
      code: "",
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      monthlyPriceCents: plan?.monthlyPriceCents ?? undefined,
      yearlyPriceCents: plan?.yearlyPriceCents ?? undefined,
      trialDays: plan?.trialDays ?? undefined,
      maxSeats: plan?.maxSeats ?? undefined,
      maxProjects: plan?.maxProjects ?? undefined,
      maxClients: plan?.maxClients ?? undefined,
      monthlyApiCallsLimit: plan?.monthlyApiCallsLimit ?? undefined,
      displayOrder: plan?.displayOrder ?? 0,
      recommendedBadge: toSelectBadge(plan?.recommendedBadge),
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        code: "",
        name: plan?.name ?? "",
        description: plan?.description ?? "",
        monthlyPriceCents: plan?.monthlyPriceCents ?? undefined,
        yearlyPriceCents: plan?.yearlyPriceCents ?? undefined,
        trialDays: plan?.trialDays ?? undefined,
        maxSeats: plan?.maxSeats ?? undefined,
        maxProjects: plan?.maxProjects ?? undefined,
        maxClients: plan?.maxClients ?? undefined,
        monthlyApiCallsLimit: plan?.monthlyApiCallsLimit ?? undefined,
        displayOrder: plan?.displayOrder ?? 0,
        recommendedBadge: toSelectBadge(plan?.recommendedBadge),
      });
      setFeaturesText((plan?.features ?? []).join("\n"));
    }
  }, [open, plan, reset]);

  function onSubmit(values: CreatePlanValues) {
    startTransition(async () => {
      const features = featuresText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        ...values,
        recommendedBadge: fromSelectBadge(values.recommendedBadge),
        features: features.length > 0 ? features : undefined,
      };
      const result = isEdit
        ? await updatePlanAction(plan!.id, payload)
        : await createPlanAction(payload);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEdit ? "Plan updated." : "Plan created.");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${plan!.name}` : "Create plan"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as SubmitHandler<CreatePlanValues>)} className="space-y-4">
          {!isEdit && (
            <ControlledInput
              control={control}
              name="code"
              label="Code"
              placeholder="e.g. starter_v2"
              description="Lowercase letters, numbers, underscores only. Cannot be changed after creation."
              error={(errors as { code?: import("react-hook-form").FieldError }).code}
            />
          )}

          <FormGrid cols={2}>
            <ControlledInput
              control={control}
              name="name"
              label="Name"
              placeholder="Starter"
              error={errors.name}
            />
            <ControlledSelect
              control={control}
              name="recommendedBadge"
              label="Badge"
              options={BADGE_OPTIONS}
            />
          </FormGrid>

          <ControlledTextarea
            control={control}
            name="description"
            label="Description"
            placeholder="Brief description for the pricing page."
            rows={2}
          />

          <FormGrid cols={2}>
            <ControlledInput
              control={control}
              name="monthlyPriceCents"
              label="Monthly price (cents)"
              type="number"
              placeholder="2900"
            />
            <ControlledInput
              control={control}
              name="yearlyPriceCents"
              label="Yearly price (cents)"
              type="number"
              placeholder="29000"
            />
          </FormGrid>

          <FormGrid cols={2}>
            <ControlledInput
              control={control}
              name="trialDays"
              label="Trial days"
              type="number"
              placeholder="14"
            />
            <ControlledInput
              control={control}
              name="displayOrder"
              label="Display order"
              type="number"
              placeholder="0"
            />
          </FormGrid>

          <FormGrid cols={3}>
            <ControlledInput
              control={control}
              name="maxSeats"
              label="Max seats"
              type="number"
              placeholder="∞"
            />
            <ControlledInput
              control={control}
              name="maxProjects"
              label="Max projects"
              type="number"
              placeholder="∞"
            />
            <ControlledInput
              control={control}
              name="maxClients"
              label="Max clients"
              type="number"
              placeholder="∞"
            />
          </FormGrid>

          <ControlledInput
            control={control}
            name="monthlyApiCallsLimit"
            label="Monthly API call limit"
            type="number"
            placeholder="∞"
          />

          <div className="space-y-1.5">
            <Label htmlFor="features">Features (one per line)</Label>
            <Textarea
              id="features"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder={"Unlimited projects\nPriority support\nAPI access"}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Bullet points shown on the public pricing page. One feature per line.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
