"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlledTextarea } from "@/components/form";
import { toast } from "sonner";
import {
  resolveIncidentSchema,
  type ResolveIncidentValues,
} from "@/schemas/admin/status-incidents";
import { resolveIncidentAction } from "@/server/actions/admin/status-incidents";

export function ResolveBlock({
  incidentId,
  onSuccess,
}: {
  incidentId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const form = useForm<ResolveIncidentValues>({
    resolver: zodResolver(resolveIncidentSchema) as Resolver<ResolveIncidentValues>,
    defaultValues: { body: "" },
  });
  const onSubmit: SubmitHandler<ResolveIncidentValues> = (values) => {
    startTransition(async () => {
      const result = await resolveIncidentAction(incidentId, values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Incident resolved.");
      onSuccess();
    });
  };

  if (!confirming) {
    return (
      <div className="flex justify-end">
        <Button variant="default" onClick={() => setConfirming(true)} className="gap-1.5">
          <CheckCircle2 size={14} /> Resolve incident
        </Button>
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">Resolve incident</h2>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"
      >
        <ControlledTextarea
          control={form.control}
          name="body"
          label="Resolution note (optional)"
          placeholder="Fix has been deployed and verified. Customers should see normal performance."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button variant="default" type="submit" disabled={isPending}>
            {isPending ? "Resolving..." : "Confirm resolve"}
          </Button>
        </div>
      </form>
    </section>
  );
}
