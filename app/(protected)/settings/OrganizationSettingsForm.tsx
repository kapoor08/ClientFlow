"use client";

import { useActionState, useState } from "react";
import { Building2, Globe, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  const initialState: SettingsActionState = {
    status: "idle",
    message: "",
  };
  const [state, formAction, isPending] = useActionState(
    updateOrganizationSettingsAction,
    initialState,
  );
  const [requireEmailVerification, setRequireEmailVerification] = useState(
    initialValues.requireEmailVerification,
  );

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      {state.status !== "idle" ? (
        <div
          className={`rounded-card border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-destructive/20 bg-destructive/5 text-destructive"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="rounded-card border border-border bg-card p-6 shadow-cf-1">
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-muted-foreground" />
          <h2 className="font-display text-base font-semibold text-foreground">
            General
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialValues.organizationName}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
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
        </div>
      </div>

      <div className="rounded-card border border-border bg-card p-6 shadow-cf-1">
        <div className="mb-4 flex items-center gap-2">
          <Globe size={18} className="text-muted-foreground" />
          <h2 className="font-display text-base font-semibold text-foreground">
            Localization
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </div>

      <div className="rounded-card border border-border bg-card p-6 shadow-cf-1">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-muted-foreground" />
          <h2 className="font-display text-base font-semibold text-foreground">
            Authentication Policy
          </h2>
        </div>
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
          <div className="flex items-center gap-3">
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
      </div>

      <Button type="submit" disabled={isPending}>
        <Save size={14} className="mr-1.5" />
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
};

export default OrganizationSettingsForm;
