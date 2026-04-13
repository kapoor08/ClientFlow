"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ControlledInput } from "@/components/form";
import { toast } from "sonner";
import { clonePlanSchema, type ClonePlanValues } from "@/schemas/admin/plans";
import { clonePlanAction } from "@/server/actions/admin/plans";

type Props = {
  sourcePlanId: string;
  sourcePlanName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ClonePlanDialog({ sourcePlanId, sourcePlanName, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClonePlanValues>({
    resolver: zodResolver(clonePlanSchema),
    defaultValues: { sourcePlanId, code: "", name: `${sourcePlanName} (copy)` },
  });

  useEffect(() => {
    if (open) reset({ sourcePlanId, code: "", name: `${sourcePlanName} (copy)` });
  }, [open, sourcePlanId, sourcePlanName, reset]);

  function onSubmit(values: ClonePlanValues) {
    startTransition(async () => {
      const result = await clonePlanAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Plan cloned. It is inactive - edit before activating.");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy size={15} />
            Clone plan
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Creates a new inactive plan based on{" "}
            <strong className="text-foreground">{sourcePlanName}</strong>.
          </p>

          <ControlledInput
            control={control}
            name="code"
            label="New code"
            placeholder="e.g. starter_v2"
            description="Immutable after creation."
            error={errors.code}
          />
          <ControlledInput
            control={control}
            name="name"
            label="New name"
            error={errors.name}
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
              {isPending ? "Cloning…" : "Clone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
