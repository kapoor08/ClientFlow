"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveOrganizationProfileAction,
  type OnboardingActionState,
} from "../actions";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "CHF", label: "CHF — Swiss Franc" },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

type Props = {
  defaultName: string;
  defaultSlug: string;
  defaultTimezone: string;
  defaultCurrency: string;
};

export default function OrganizationStepForm({
  defaultName,
  defaultSlug,
  defaultTimezone,
  defaultCurrency,
}: Props) {
  const initial: OnboardingActionState = { status: "idle", message: "" };
  const [state, formAction, isPending] = useActionState(
    saveOrganizationProfileAction,
    initial,
  );

  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(defaultSlug);
  const [timezone, setTimezone] = useState(defaultTimezone || "UTC");
  const [currency, setCurrency] = useState(defaultCurrency || "USD");

  function handleNameChange(v: string) {
    setName(v);
    setSlug(slugify(v));
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && (
        <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Organization name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Acme Agency"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL slug</Label>
        <div className="flex items-center rounded-lg border border-border bg-secondary/50 px-3 text-sm text-muted-foreground">
          <span className="shrink-0">clientflow.app/</span>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="acme-agency"
            required
            disabled={isPending}
            className="flex-1 bg-transparent py-2 pl-0 pr-2 text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-60">
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="timezone" value={timezone} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currencyCode">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="currencyCode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-60">
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="currencyCode" value={currency} />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
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
