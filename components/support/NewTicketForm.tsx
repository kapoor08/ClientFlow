"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ControlledInput, ControlledTextarea, ControlledSelect } from "@/components/form";
import { createTicketSchema, type CreateTicketValues, TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/schemas/support";
import { createTicketAction } from "@/server/actions/support";

export function NewTicketForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTicketValues>({
    resolver: zodResolver(createTicketSchema) as Resolver<CreateTicketValues>,
    defaultValues: { subject: "", description: "", category: "general", priority: "normal" },
  });

  function onSubmit(values: CreateTicketValues) {
    startTransition(async () => {
      const result = await createTicketAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Ticket submitted. We'll be in touch soon.");
        router.push(result.id ? `/client-portal/support/${result.id}` : "/client-portal/support");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <ControlledInput
        control={control}
        name="subject"
        label="Subject"
        placeholder="Brief description of your issue"
        error={errors.subject}
      />

      <div className="grid grid-cols-2 gap-4">
        <ControlledSelect
          control={control}
          name="category"
          label="Category"
          options={TICKET_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          error={errors.category}
        />
        <ControlledSelect
          control={control}
          name="priority"
          label="Priority"
          options={TICKET_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
          error={errors.priority}
        />
      </div>

      <ControlledTextarea
        control={control}
        name="description"
        label="Description"
        placeholder="Describe your issue in detail so we can help you faster."
        rows={6}
        error={errors.description}
      />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit ticket"}
        </Button>
      </div>
    </form>
  );
}
