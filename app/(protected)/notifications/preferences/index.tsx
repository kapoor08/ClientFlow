"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PushEnableButton } from "@/components/notifications/PushEnableButton";
import {
  useNotificationPreferences,
  useUpdatePreference,
  useBulkUpdatePreferences,
} from "@/core/notifications/useCase";
import { NOTIFICATION_EVENT_CATEGORIES } from "@/lib/notifications-shared";
import type { NotificationEventKey, NotificationPreference } from "@/lib/notifications-shared";

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
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

function PreferenceRow({
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
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-8 shrink-0">
        <Toggle
          checked={inAppEnabled}
          onChange={(val) =>
            update.mutate({ eventKey, inAppEnabled: val, emailEnabled })
          }
          disabled={isPending}
        />
        <Toggle
          checked={emailEnabled}
          onChange={(val) =>
            update.mutate({ eventKey, inAppEnabled, emailEnabled: val })
          }
          disabled={isPending}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const NotificationPreferencesPage = () => {
  const { data, isLoading } = useNotificationPreferences();
  const bulkUpdate = useBulkUpdatePreferences();

  const preferences: NotificationPreference[] = data?.preferences ?? [];

  const getPreference = (key: NotificationEventKey): NotificationPreference =>
    preferences.find((p) => p.eventKey === key) ?? {
      eventKey: key,
      inAppEnabled: true,
      emailEnabled: true,
    };

  const allInAppEnabled = preferences.length > 0 && preferences.every((p) => p.inAppEnabled);
  const allEmailEnabled = preferences.length > 0 && preferences.every((p) => p.emailEnabled);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/notifications"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Back to Notifications
        </Link>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Notification Preferences
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose how you want to be notified for each event type.
        </p>
      </div>

      {/* Push Notifications */}
      <div className="mb-4 rounded-card border border-border bg-card shadow-cf-1 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              Receive real-time browser push notifications even when the app is in the background.
            </p>
          </div>
          <PushEnableButton />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Global "Enable / Disable All" header */}
          <div className="rounded-card border border-border bg-card shadow-cf-1 overflow-hidden">
            <div className="border-b border-border bg-secondary/40 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Global Settings
              </p>
            </div>
            <div className="px-4">
              {/* Column labels */}
              <div className="flex items-center justify-end gap-8 pb-1 pt-3 pr-0.5">
                <span className="w-9 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  In-App
                </span>
                <span className="w-9 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Enable all notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Toggle all in-app or email notifications at once
                  </p>
                </div>
                <div className="flex items-center gap-8 shrink-0">
                  <Toggle
                    checked={allInAppEnabled}
                    onChange={(val) => bulkUpdate.mutate({ inAppEnabled: val })}
                    disabled={bulkUpdate.isPending}
                  />
                  <Toggle
                    checked={allEmailEnabled}
                    onChange={(val) => bulkUpdate.mutate({ emailEnabled: val })}
                    disabled={bulkUpdate.isPending}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Per-event categories */}
          {/* Column labels repeated above the list */}
          <div className="flex items-center justify-end gap-8 pr-4">
            <span className="w-9 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              In-App
            </span>
            <span className="w-9 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Email
            </span>
          </div>

          {NOTIFICATION_EVENT_CATEGORIES.map((cat) => (
            <div
              key={cat.category}
              className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1"
            >
              <div className="border-b border-border bg-secondary/40 px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {cat.category}
                </p>
              </div>
              <div className="px-4">
                {cat.events.map((event) => {
                  const pref = getPreference(event.key);
                  return (
                    <PreferenceRow
                      key={event.key}
                      eventKey={event.key}
                      label={event.label}
                      description={event.description}
                      inAppEnabled={pref.inAppEnabled}
                      emailEnabled={pref.emailEnabled}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPreferencesPage;
