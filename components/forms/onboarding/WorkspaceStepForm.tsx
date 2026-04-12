"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ControlledInput, ControlledSelect } from "@/components/form";
import {
  INVITE_ROLE_OPTIONS,
  getDefaultWorkspaceInvitesValues,
  workspaceInvitesSchema,
  type WorkspaceInvitesFormValues,
} from "@/schemas/onboarding";

const roleOptions = INVITE_ROLE_OPTIONS.map((r) => ({
  value: r.value,
  label: r.label,
}));

const MAX_INVITES = 5;

export function WorkspaceStepForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkspaceInvitesFormValues>({
    mode: "onBlur",
    resolver: zodResolver(workspaceInvitesSchema),
    defaultValues: getDefaultWorkspaceInvitesValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invites",
  });

  const onSubmit = (values: WorkspaceInvitesFormValues) => {
    setServerError(null);
    const validInvites = values.invites.filter(
      (inv) => inv.email.trim().length > 0,
    );

    if (validInvites.length === 0) {
      router.push("/onboarding/complete");
      return;
    }

    startTransition(async () => {
      try {
        await Promise.all(
          validInvites.map((inv) =>
            fetch("/api/invitations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: inv.email.trim(),
                roleKey: inv.role,
              }),
            }).then(async (res) => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(
                  (data as { error?: string }).error ??
                    `Failed to invite ${inv.email}`,
                );
              }
            }),
          ),
        );
        setSent(true);
        setTimeout(() => router.push("/onboarding/complete"), 1200);
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Failed to send invitations.",
        );
      }
    });
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 size={40} className="text-success" />
        <p className="text-sm font-medium text-foreground">Invitations sent!</p>
        <p className="text-xs text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <div className="space-y-4">
        {fields.length > 0 && (
          <div className="grid grid-cols-[1fr_9rem_auto] gap-2">
            <Label>Email address</Label>
            <Label>Role</Label>
            <span />
          </div>
        )}

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_9rem_auto] items-start gap-2"
          >
            <ControlledInput
              name={`invites.${index}.email`}
              control={control}
              type="email"
              placeholder="teammate@company.com"
              error={errors.invites?.[index]?.email}
              disabled={isPending}
            />
            <ControlledSelect
              name={`invites.${index}.role`}
              control={control}
              options={roleOptions}
              error={errors.invites?.[index]?.role}
              disabled={isPending}
            />
            {fields.length > 1 ? (
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={isPending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                aria-label={`Remove invite ${index + 1}`}
              >
                <X size={14} />
              </button>
            ) : (
              <span className="h-9 w-9" />
            )}
          </div>
        ))}
      </div>

      {fields.length < MAX_INVITES && (
        <button
          type="button"
          onClick={() => append({ email: "", role: "member" })}
          disabled={isPending}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
        >
          <Plus size={14} />
          Add another
        </button>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 cursor-pointer"
          onClick={() => router.push("/onboarding/complete")}
          disabled={isPending}
        >
          Skip for now
        </Button>
        <Button type="submit" className="flex-1 cursor-pointer" disabled={isPending}>
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Send invites <ArrowRight size={16} />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
