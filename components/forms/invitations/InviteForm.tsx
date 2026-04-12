"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlledInput } from "@/components/form";
import { ControlledSelect } from "@/components/form";
import { FormSection } from "@/components/form";
import { FormGrid } from "@/components/form";
import {
  inviteFormSchema,
  getDefaultInviteFormValues,
  type InviteFormValues,
} from "@/schemas/invitations";
import { useSendInvitation } from "@/core/invitations/useCase";
import { useAssignableRoles } from "@/core/invitations/useCase";

export function InviteForm() {
  const router = useRouter();
  const sendInvitation = useSendInvitation();
  const { data: rolesData, isLoading: rolesLoading } = useAssignableRoles();

  const serverError = sendInvitation.error?.message ?? null;

  const {
    handleSubmit,
    control,
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
        router.push("/invitations");
        router.refresh();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError ? (
        <div className="rounded-card border border-error-border bg-error-surface px-4 py-3 text-sm text-error">
          {serverError}
        </div>
      ) : null}

      <FormSection
        title="Invite Details"
        description="Enter the email address and role for the person you want to invite."
      >
        <FormGrid cols={2}>
          <div className="md:col-span-2">
            <ControlledInput
              name="email"
              label="Email Address*"
              type="email"
              control={control}
              error={errors.email}
              placeholder="colleague@example.com"
              disabled={isPending}
            />
          </div>
          <div className="md:col-span-2">
            <ControlledSelect
              name="roleId"
              label="Role*"
              control={control}
              error={errors.roleId}
              options={roleOptions}
              placeholder={rolesLoading ? "Loading roles…" : "Select a role"}
              disabled={isPending || rolesLoading}
            />
          </div>
        </FormGrid>
      </FormSection>

      <div>
        <Button type="submit" disabled={isPending} className="cursor-pointer">
          <Send size={14} className="mr-1.5" />
          {isPending ? "Sending…" : "Send Invitation"}
        </Button>
      </div>
    </form>
  );
}
