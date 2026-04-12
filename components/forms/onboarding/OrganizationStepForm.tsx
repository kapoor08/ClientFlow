"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlledInput, ControlledSelect } from "@/components/form";
import {
  saveOrganizationProfileAction,
  type OnboardingActionState,
} from "@/server/actions/onboarding";
import {
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  getDefaultOrganizationProfileValues,
  organizationProfileSchema,
  slugifyOrganizationName,
  type OrganizationProfileFormValues,
} from "@/schemas/onboarding";

const timezoneOptions = TIMEZONE_OPTIONS.map((tz) => ({ value: tz, label: tz }));
const currencyOptions = CURRENCY_OPTIONS.map((c) => ({
  value: c.value,
  label: c.label,
}));

type Props = {
  defaultName: string;
  defaultSlug: string;
  defaultTimezone: string;
  defaultCurrency: string;
};

export function OrganizationStepForm({
  defaultName,
  defaultSlug,
  defaultTimezone,
  defaultCurrency,
}: Props) {
  const initial: OnboardingActionState = { status: "idle", message: "" };
  const [state, formAction, isActionPending] = useActionState(
    saveOrganizationProfileAction,
    initial,
  );
  const [isTransitionPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<OrganizationProfileFormValues>({
    mode: "onBlur",
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: getDefaultOrganizationProfileValues({
      name: defaultName,
      slug: defaultSlug || slugifyOrganizationName(defaultName),
      timezone: defaultTimezone || "UTC",
      currencyCode: defaultCurrency || "USD",
    }),
  });

  // Auto-sync slug from name until the user manually edits the slug field.
  // setValue() with shouldDirty:false (default) does not mark the field dirty,
  // so dirtyFields.slug only becomes true when the user types into it.
  const watchedName = watch("name");
  const slugIsUserEdited = Boolean(dirtyFields.slug);
  useEffect(() => {
    if (slugIsUserEdited) return;
    setValue("slug", slugifyOrganizationName(watchedName ?? ""), {
      shouldValidate: false,
    });
  }, [watchedName, slugIsUserEdited, setValue]);

  const isPending = isActionPending || isTransitionPending;

  const onSubmit = (values: OrganizationProfileFormValues) => {
    const fd = new FormData();
    fd.set("name", values.name);
    fd.set("slug", values.slug);
    fd.set("timezone", values.timezone);
    fd.set("currencyCode", values.currencyCode);
    startTransition(() => {
      formAction(fd);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {state.status === "error" && (
        <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </div>
      )}

      <ControlledInput
        name="name"
        label="Organization name"
        control={control}
        error={errors.name}
        placeholder="Acme Agency"
        disabled={isPending}
      />

      <ControlledInput
        name="slug"
        label="URL slug"
        description="client-flow.in/your-workspace"
        control={control}
        error={errors.slug}
        placeholder="acme-agency"
        disabled={isPending}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ControlledSelect
          name="timezone"
          label="Timezone"
          control={control}
          error={errors.timezone}
          options={timezoneOptions}
          disabled={isPending}
        />
        <ControlledSelect
          name="currencyCode"
          label="Currency"
          control={control}
          error={errors.currencyCode}
          options={currencyOptions}
          disabled={isPending}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full cursor-pointer">
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            Continue <ArrowRight size={16} />
          </>
        )}
      </Button>
    </form>
  );
}
