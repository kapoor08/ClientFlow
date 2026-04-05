"use client";

import { toast } from "sonner";
import { useUpdatePreference } from "@/core/notifications/useCase";
import type { NotificationEventKey } from "@/lib/notifications-shared";

// ─── Toggle switch ────────────────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-lg transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── Individual preference row ────────────────────────────────────────────────

export function PreferenceRow({
  eventKey,
  label,
  description,
  inAppEnabled,
  emailEnabled,
}: {
  eventKey: NotificationEventKey;
  label: string;
  description: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}) {
  const update = useUpdatePreference();
  const isPending = update.isPending;

  return (
    <div className="grid grid-cols-[1fr_80px_80px] items-center gap-2 border-b border-border py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex justify-center">
        <Toggle
          checked={inAppEnabled}
          onChange={(val) =>
            update.mutate(
              { eventKey, inAppEnabled: val, emailEnabled },
              {
                onSuccess: () => toast.success("Notification preference saved."),
                onError: (err) => toast.error(err instanceof Error ? err.message : "Something went wrong."),
              },
            )
          }
          disabled={isPending}
        />
      </div>
      <div className="flex justify-center">
        <Toggle
          checked={emailEnabled}
          onChange={(val) =>
            update.mutate(
              { eventKey, inAppEnabled, emailEnabled: val },
              {
                onSuccess: () => toast.success("Notification preference saved."),
                onError: (err) => toast.error(err instanceof Error ? err.message : "Something went wrong."),
              },
            )
          }
          disabled={isPending}
        />
      </div>
    </div>
  );
}
