"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSection } from "@/components/form";
import { FormGrid } from "@/components/form";
import type { OrganizationSettingsContext } from "@/server/organization-settings";
import {
  type SettingsActionState,
  updateOrganizationSettingsAction,
} from "@/server/actions/settings";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "America/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "America/Toronto", label: "Eastern Time (Toronto)" },
  { value: "America/Vancouver", label: "Pacific Time (Vancouver)" },
  { value: "America/Mexico_City", label: "Central Time (Mexico City)" },
  { value: "America/Sao_Paulo", label: "Brasília Time (São Paulo)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)" },
  { value: "Europe/London", label: "GMT (London)" },
  { value: "Europe/Paris", label: "Central European Time (Paris)" },
  { value: "Europe/Berlin", label: "Central European Time (Berlin)" },
  { value: "Europe/Rome", label: "Central European Time (Rome)" },
  { value: "Europe/Madrid", label: "Central European Time (Madrid)" },
  { value: "Europe/Amsterdam", label: "Central European Time (Amsterdam)" },
  { value: "Europe/Stockholm", label: "Central European Time (Stockholm)" },
  { value: "Europe/Moscow", label: "Moscow Time" },
  { value: "Europe/Istanbul", label: "Turkey Time (Istanbul)" },
  { value: "Africa/Cairo", label: "Eastern European Time (Cairo)" },
  { value: "Africa/Johannesburg", label: "South Africa Standard Time" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (Dubai)" },
  { value: "Asia/Karachi", label: "Pakistan Standard Time (Karachi)" },
  { value: "Asia/Kolkata", label: "India Standard Time (Kolkata)" },
  { value: "Asia/Dhaka", label: "Bangladesh Standard Time (Dhaka)" },
  { value: "Asia/Bangkok", label: "Indochina Time (Bangkok)" },
  { value: "Asia/Singapore", label: "Singapore Time" },
  { value: "Asia/Hong_Kong", label: "Hong Kong Time" },
  { value: "Asia/Shanghai", label: "China Standard Time (Shanghai)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (Tokyo)" },
  { value: "Asia/Seoul", label: "Korea Standard Time (Seoul)" },
  { value: "Australia/Perth", label: "Australian Western Time (Perth)" },
  { value: "Australia/Adelaide", label: "Australian Central Time (Adelaide)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (Sydney)" },
  { value: "Pacific/Auckland", label: "New Zealand Time (Auckland)" },
];

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "MXN", label: "MXN - Mexican Peso" },
  { value: "BRL", label: "BRL - Brazilian Real" },
  { value: "NOK", label: "NOK - Norwegian Krone" },
  { value: "SEK", label: "SEK - Swedish Krona" },
  { value: "DKK", label: "DKK - Danish Krone" },
  { value: "ZAR", label: "ZAR - South African Rand" },
  { value: "HKD", label: "HKD - Hong Kong Dollar" },
  { value: "NZD", label: "NZD - New Zealand Dollar" },
  { value: "THB", label: "THB - Thai Baht" },
];

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [timezone, setTimezone] = useState(initialValues.timezone ?? "UTC");
  const [currencyCode, setCurrencyCode] = useState(
    initialValues.currencyCode ?? "USD",
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
            <Select
              value={timezone}
              onValueChange={setTimezone}
              disabled={isPending}
            >
              <SelectTrigger id="timezone" className="w-full cursor-pointer">
                <SelectValue placeholder="Select timezone…" />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {TIMEZONES.map((tz) => (
                  <SelectItem
                    key={tz.value}
                    value={tz.value}
                    className="cursor-pointer"
                  >
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="timezone" value={timezone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currencyCode">Currency</Label>
            <Select
              value={currencyCode}
              onValueChange={setCurrencyCode}
              disabled={isPending}
            >
              <SelectTrigger id="currencyCode" className="w-full cursor-pointer">
                <SelectValue placeholder="Select currency…" />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {CURRENCIES.map((c) => (
                  <SelectItem
                    key={c.value}
                    value={c.value}
                    className="cursor-pointer"
                  >
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="currencyCode" value={currencyCode} />
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
