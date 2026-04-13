"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PowerOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ControlledTextarea } from "@/components/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { suspendOrgSchema, type SuspendOrgValues } from "@/schemas/admin/organizations";
import { suspendOrgAction } from "@/server/actions/admin/organizations";

type Props = {
  orgId: string;
  orgName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SuspendOrgDialog({ orgId, orgName, open, onOpenChange }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuspendOrgValues>({
    resolver: zodResolver(suspendOrgSchema),
    defaultValues: { orgId, reason: "" },
  });

  function onSubmit(values: SuspendOrgValues) {
    startTransition(async () => {
      const result = await suspendOrgAction(values.orgId, values.reason);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${orgName} has been suspended.`);
        reset();
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
            <PowerOff size={16} className="text-warning" />
            Suspend organization
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{orgName}</strong> will be suspended. Members
            will not be able to access the workspace until it is restored.
          </p>

          <ControlledTextarea
            control={control}
            name="reason"
            label="Reason"
            placeholder="Why is this organization being suspended?"
            rows={3}
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
            <Button
              type="submit"
              className="bg-warning text-warning-foreground hover:bg-warning/90"
              disabled={isPending}
            >
              {isPending ? "Suspending…" : "Suspend"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
