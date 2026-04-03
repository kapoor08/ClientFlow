"use client";

import { useActionState, useState } from "react";
import { Building2, Globe, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormSection } from "@/components/form/FormSection";
import { FormGrid } from "@/components/form/FormGrid";
import type { OrganizationSettingsContext } from "@/lib/organization-settings";
import {
  type SettingsActionState,
  updateOrganizationSettingsAction,
} from "./actions";

type OrganizationSettingsFormProps = {
  initialValues: OrganizationSettingsContext;
};

const OrganizationSettingsForm = ({
  initialValues,
}: OrganizationSettingsFormProps) => {
  const initialState: SettingsActionState = { status: "idle", message: "" };
  const [state, formAction, isPending] = useActionState(
    updateOrganizationSettingsAction,
    initialState,
  );
  const [requireEmailVerification, setRequireEmailVerification] = useState(
    initialValues.requireEmailVerification,
  );

  return (
    <form action={formAction} className="max-w-full space-y-6">
      {state.status !== "idle" && (
        <div
          className={`rounded-card border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-error-border bg-error-surface text-error"
          }`}
        >
          {state.message}
        </div>
      )}

      {/* General */}
      <FormSection
        title="General"
        description="Your organization's public-facing name and URL slug."
      >
        <FormGrid cols={2}>
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialValues.organizationName}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={initialValues.organizationSlug}
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Used for workspace URLs and internal organization references.
            </p>
          </div>
        </FormGrid>
      </FormSection>

      {/* Localization */}
      <FormSection
        title="Localization"
        description="Set the default timezone and currency for your organization."
      >
        <FormGrid cols={2}>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={initialValues.timezone ?? "UTC"}
              disabled={isPending}
              placeholder="UTC"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currencyCode">Currency</Label>
            <Input
              id="currencyCode"
              name="currencyCode"
              defaultValue={initialValues.currencyCode ?? "USD"}
              disabled={isPending}
              placeholder="USD"
            />
          </div>
        </FormGrid>
      </FormSection>

      {/* Authentication Policy */}
      <FormSection
        title="Authentication Policy"
        description="Control sign-in requirements for all members."
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Require email verification before sign-in
            </p>
            <p className="text-sm text-muted-foreground">
              When enabled, unverified members are blocked at sign-in until they
              confirm their email address.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {requireEmailVerification ? "Required" : "Optional"}
            </span>
            <Switch
              checked={requireEmailVerification}
              onCheckedChange={setRequireEmailVerification}
              disabled={isPending}
              aria-label="Require email verification"
            />
          </div>
        </div>
        <input
          type="hidden"
          name="requireEmailVerification"
          value={requireEmailVerification ? "true" : "false"}
        />
      </FormSection>

      <Button type="submit" disabled={isPending} className="cursor-pointer">
        <Save size={14} className="mr-1.5" />
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
};

export default OrganizationSettingsForm;
