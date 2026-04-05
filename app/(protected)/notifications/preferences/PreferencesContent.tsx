"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PushEnableButton } from "@/components/notifications/PushEnableButton";
import {
  useNotificationPreferences,
  useBulkUpdatePreferences,
} from "@/core/notifications/useCase";
import { NOTIFICATION_EVENT_CATEGORIES } from "@/lib/notifications-shared";
import type {
  NotificationEventKey,
  NotificationPreference,
} from "@/lib/notifications-shared";
import { Toggle, PreferenceRow } from "./PreferenceRow";

// ─── Shared column header row ─────────────────────────────────────────────────

function ColHeaders({ label }: { label: string }) {
  return (
    <div className="grid grid-cols-[1fr_80px_80px] items-center gap-2 border-b border-border bg-secondary/40 px-4 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        In-App
      </span>
      <span className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Email
      </span>
    </div>
  );
}

// ─── PreferencesContent ───────────────────────────────────────────────────────

export function PreferencesContent() {
  const { data, isLoading } = useNotificationPreferences();
  const bulkUpdate = useBulkUpdatePreferences();

  const preferences: NotificationPreference[] = data?.preferences ?? [];

  const getPreference = (key: NotificationEventKey): NotificationPreference =>
    preferences.find((p) => p.eventKey === key) ?? {
      eventKey: key,
      inAppEnabled: true,
      emailEnabled: true,
    };

  const allInAppEnabled =
    preferences.length > 0 && preferences.every((p) => p.inAppEnabled);
  const allEmailEnabled =
    preferences.length > 0 && preferences.every((p) => p.emailEnabled);

  return (
    <div className="space-y-4">
      {/* Push Notifications */}
      <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Push Notifications
            </p>
            <p className="text-xs text-muted-foreground">
              Receive real-time browser push notifications even when the app is
              in the background.
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
        <>
          {/* Global toggles */}
          <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
            <ColHeaders label="All" />
            <div className="px-4">
              <div className="grid grid-cols-[1fr_80px_80px] items-center gap-2 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Enable all notifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Toggle all in-app or email notifications at once
                  </p>
                </div>
                <div className="flex justify-center">
                  <Toggle
                    checked={allInAppEnabled}
                    onChange={(val) =>
                      bulkUpdate.mutate(
                        { inAppEnabled: val },
                        {
                          onSuccess: () =>
                            toast.success("All in-app notifications updated."),
                          onError: (err) =>
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : "Something went wrong.",
                            ),
                        },
                      )
                    }
                    disabled={bulkUpdate.isPending}
                  />
                </div>
                <div className="flex justify-center">
                  <Toggle
                    checked={allEmailEnabled}
                    onChange={(val) =>
                      bulkUpdate.mutate(
                        { emailEnabled: val },
                        {
                          onSuccess: () =>
                            toast.success("All email notifications updated."),
                          onError: (err) =>
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : "Something went wrong.",
                            ),
                        },
                      )
                    }
                    disabled={bulkUpdate.isPending}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Per-event categories */}
          {NOTIFICATION_EVENT_CATEGORIES.map((cat) => (
            <div
              key={cat.category}
              className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1"
            >
              <ColHeaders label={cat.category} />
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
        </>
      )}
    </div>
  );
}
