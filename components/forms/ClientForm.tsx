"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ControlledInput } from "@/components/form/ControlledInput";
import { ControlledPhoneInput } from "@/components/form/ControlledPhoneInput";
import { ControlledSelect } from "@/components/form/ControlledSelect";
import { ControlledTextarea } from "@/components/form/ControlledTextarea";
import { FormSection } from "@/components/form/FormSection";
import { FormGrid } from "@/components/form/FormGrid";
import {
  CLIENT_STATUS_OPTIONS,
  clientFormSchema,
  getDefaultClientFormValues,
  type ClientFormValues,
} from "@/lib/clients-shared";
import { useCreateClient, useUpdateClient } from "@/core/clients";

type ClientFormMode = { mode: "create" } | { mode: "edit"; clientId: string };

type ClientFormProps = ClientFormMode & {
  submitLabel?: string;
  initialValues?: ClientFormValues;
};

const statusOptions = CLIENT_STATUS_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function ClientForm(props: ClientFormProps) {
  const { submitLabel = "Save", initialValues } = props;
  const router = useRouter();

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const mutation = props.mode === "edit" ? updateClient : createClient;
  const serverError = mutation.error?.message ?? null;

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    mode: "onBlur",
    resolver: zodResolver(clientFormSchema),
    defaultValues: initialValues ?? getDefaultClientFormValues(),
  });

  const isPending = isSubmitting || mutation.isPending;

  const onSubmit = async (values: ClientFormValues) => {
    if (props.mode === "edit") {
      updateClient.mutate(
        { clientId: props.clientId, data: values },
        {
          onSuccess: () => {
            toast.success("Client updated.");
            router.push(`/clients/${props.clientId}`);
            router.refresh();
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update client."),
        },
      );
    } else {
      createClient.mutate(values, {
        onSuccess: (data) => {
          toast.success("Client created.");
          router.push(`/clients/${data.clientId}`);
          router.refresh();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create client."),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError ? (
        <div className="rounded-card border border-error-border bg-error-surface px-4 py-3 text-sm text-error">
          {serverError}
        </div>
      ) : null}

      <FormSection
        title="Client Details"
        description="Basic information about this client."
        className="mb-2!"
      >
        <FormGrid cols={2}>
          <div className="md:col-span-2">
            <ControlledInput
              name="name"
              label="Client Name*"
              control={control}
              error={errors.name}
              placeholder="Acme Corporation"
              disabled={isPending}
            />
          </div>
          <ControlledInput
            name="company"
            label="Company*"
            control={control}
            error={errors.company}
            placeholder="Acme Corporation"
            disabled={isPending}
          />
          <ControlledSelect
            name="status"
            label="Status*"
            control={control}
            error={errors.status}
            options={statusOptions}
            disabled={isPending}
          />
        </FormGrid>
      </FormSection>

      <FormSection
        title="Primary Contact"
        description="Store the main point of contact for this client."
      >
        <FormGrid cols={2}>
          <ControlledInput
            name="contactName"
            label="Contact Name*"
            control={control}
            error={errors.contactName}
            placeholder="Jane Doe"
            disabled={isPending}
          />
          <ControlledInput
            name="contactEmail"
            label="Contact Email"
            type="email"
            control={control}
            error={errors.contactEmail}
            placeholder="jane@acme.com"
            disabled={isPending}
          />
          <div className="md:col-span-2">
            <ControlledPhoneInput
              name="contactPhone"
              label="Contact Phone"
              control={control}
              error={errors.contactPhone}
              disabled={isPending}
            />
          </div>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Notes"
        description="Add delivery preferences, business context, or other relevant notes."
      >
        <ControlledTextarea
          name="notes"
          control={control}
          error={errors.notes}
          rows={6}
          placeholder="Important context for your team…"
          disabled={isPending}
        />
      </FormSection>

      <div>
        <Button type="submit" disabled={isPending} className="cursor-pointer">
          <Save size={14} className="mr-1.5" />
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
