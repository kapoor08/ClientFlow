"use client";

import { useTransition } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ControlledTextarea, ControlledSelect } from "@/components/form";
import { toast } from "sonner";
import {
  addUpdateSchema,
  INCIDENT_STATES,
  type AddUpdateValues,
} from "@/schemas/admin/status-incidents";
import { addIncidentUpdateAction } from "@/server/actions/admin/status-incidents";

const STATE_OPTIONS = INCIDENT_STATES.filter((s) => s !== "resolved").map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

export function AddUpdateBlock({
  incidentId,
  onSuccess,
}: {
  incidentId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<AddUpdateValues>({
    resolver: zodResolver(addUpdateSchema) as Resolver<AddUpdateValues>,
    defaultValues: { body: "", stateAtPost: "investigating" },
  });
  const onSubmit: SubmitHandler<AddUpdateValues> = (values) => {
    startTransition(async () => {
      const result = await addIncidentUpdateAction(incidentId, values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Update posted.");
      form.reset();
      onSuccess();
    });
  };
  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">Post update</h2>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="border-border bg-card space-y-4 rounded-xl border p-5"
      >
        <ControlledSelect
          control={form.control}
          name="stateAtPost"
          label="New state"
          options={STATE_OPTIONS}
        />
        <ControlledTextarea
          control={form.control}
          name="body"
          label="Update"
          placeholder="We've identified the root cause and are deploying a fix."
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Posting..." : "Post update"}
          </Button>
        </div>
      </form>
    </section>
  );
}
