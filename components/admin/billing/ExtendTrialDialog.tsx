"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ControlledInput, ControlledTextarea } from "@/components/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { extendTrialSchema, type ExtendTrialValues } from "@/schemas/admin/billing";
import { extendTrialAction } from "@/server/actions/admin/billing";

type Props = {
  subscriptionId: string;
  orgName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExtendTrialDialog({ subscriptionId, orgName, open, onOpenChange }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExtendTrialValues>({
    resolver: zodResolver(extendTrialSchema) as Resolver<ExtendTrialValues>,
    defaultValues: { subscriptionId, days: 14, reason: "" },
  });

  function onSubmit(values: ExtendTrialValues) {
    startTransition(async () => {
      const result = await extendTrialAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Trial extended for ${orgName}.`);
        reset({ subscriptionId, days: 14, reason: "" });
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
            <CalendarPlus size={15} />
            Extend trial
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Extending the trial for <strong className="text-foreground">{orgName}</strong>.
          </p>

          <ControlledInput
            control={control}
            name="days"
            label="Additional days"
            type="number"
            placeholder="14"
            error={errors.days}
          />
          <ControlledTextarea
            control={control}
            name="reason"
            label="Reason"
            placeholder="Why is this trial being extended?"
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
              {isPending ? "Extending…" : "Extend trial"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
