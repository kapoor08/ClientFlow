"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { deleteOrgSchema, type DeleteOrgValues } from "@/schemas/admin/organizations";
import { deleteOrgAction } from "@/server/actions/admin/organizations";

type Props = {
  orgId: string;
  orgName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteOrgDialog({ orgId, orgName, open, onOpenChange }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeleteOrgValues>({
    resolver: zodResolver(deleteOrgSchema),
    defaultValues: { orgId, orgName, confirmName: "" },
  });

  function onSubmit(values: DeleteOrgValues) {
    startTransition(async () => {
      const result = await deleteOrgAction(values.orgId, values.orgName, values.confirmName);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${orgName} has been deleted.`);
        reset();
        onOpenChange(false);
        router.push("/admin/organizations");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 size={16} className="text-danger" />
            Delete organization
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong className="text-foreground">{orgName}</strong>{" "}
            and all associated data. This action cannot be undone.
          </p>
          <p className="text-sm text-muted-foreground">
            Type <strong className="text-foreground font-mono">{orgName}</strong> to confirm.
          </p>

          <ControlledInput
            control={control}
            name="confirmName"
            label="Organization name"
            placeholder={orgName}
            error={errors.confirmName}
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
              className="bg-danger text-white hover:bg-danger/90"
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
