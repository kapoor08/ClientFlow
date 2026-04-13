"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ControlledSelect, ControlledTextarea } from "@/components/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { changePlanSchema, type ChangePlanValues } from "@/schemas/admin/billing";
import { changePlanAction } from "@/server/actions/admin/billing";

type PlanOption = { value: string; label: string };

type Props = {
  subscriptionId: string;
  orgName: string;
  currentPlanId: string;
  planOptions: PlanOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePlanDialog({
  subscriptionId,
  orgName,
  currentPlanId,
  planOptions,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePlanValues>({
    resolver: zodResolver(changePlanSchema),
    defaultValues: { subscriptionId, newPlanId: currentPlanId, reason: "" },
  });

  function onSubmit(values: ChangePlanValues) {
    startTransition(async () => {
      const result = await changePlanAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Plan changed for ${orgName}.`);
        reset({ subscriptionId, newPlanId: currentPlanId, reason: "" });
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight size={15} />
            Change plan
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manually change the plan for{" "}
            <strong className="text-foreground">{orgName}</strong>. This does not affect
            billing - Stripe is not called.
          </p>

          <ControlledSelect
            control={control}
            name="newPlanId"
            label="New plan"
            options={planOptions}
            error={errors.newPlanId}
          />
          <ControlledTextarea
            control={control}
            name="reason"
            label="Reason"
            placeholder="Why is this plan being changed?"
            rows={2}
            error={errors.reason}
          />

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
              {isPending ? "Changing…" : "Change plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
