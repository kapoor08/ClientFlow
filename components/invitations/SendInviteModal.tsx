"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ControlledInput } from "@/components/form";
import { ControlledSelect } from "@/components/form";
import {
  inviteFormSchema,
  getDefaultInviteFormValues,
  type InviteFormValues,
} from "@/schemas/invitations";
import { useSendInvitation, useAssignableRoles } from "@/core/invitations/useCase";

export function SendInviteModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const sendInvitation = useSendInvitation();
  const { data: rolesData, isLoading: rolesLoading } = useAssignableRoles();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    mode: "onBlur",
    resolver: zodResolver(inviteFormSchema),
    defaultValues: getDefaultInviteFormValues(),
  });

  const isPending = isSubmitting || sendInvitation.isPending;

  const roleOptions = (rolesData?.roles ?? []).map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const onSubmit = async (values: InviteFormValues) => {
    sendInvitation.mutate(values, {
      onSuccess: () => {
        toast.success("Invitation sent.");
        setOpen(false);
        reset();
        router.refresh();
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to send invitation.");
      },
    });
  };

  function handleOpenChange(val: boolean) {
    if (!val) reset();
    setOpen(val);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="cursor-pointer">
        <Plus size={16} className="mr-1.5" />
        Send Invite
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Invitation</DialogTitle>
            <DialogDescription>
              Invite someone to join your organization. They will receive an
              email with a link to accept.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            {sendInvitation.error && (
              <div className="rounded-card border border-error-border bg-error-surface px-4 py-3 text-sm text-error">
                {sendInvitation.error.message}
              </div>
            )}

            <ControlledInput
              name="email"
              label="Email Address*"
              type="email"
              control={control}
              error={errors.email}
              placeholder="colleague@example.com"
              disabled={isPending}
            />

            <ControlledSelect
              name="roleId"
              label="Role*"
              control={control}
              error={errors.roleId}
              options={roleOptions}
              placeholder={rolesLoading ? "Loading roles…" : "Select a role"}
              disabled={isPending || rolesLoading}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="cursor-pointer">
                <Send size={14} className="mr-1.5" />
                {isPending ? "Sending…" : "Send Invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
