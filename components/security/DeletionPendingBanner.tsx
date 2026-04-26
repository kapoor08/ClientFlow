"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Status = {
  scheduled: boolean;
  scheduledFor: string | null;
  daysRemaining: number | null;
};

/**
 * Global banner shown on every protected page while the user is in the 30-day
 * deletion grace period. Fetches status once on mount - cheap, same rate-limit
 * bucket as the rest of /api/*.
 */
export function DeletionPendingBanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/settings/account-deletion")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStatus(data?.status ?? null))
      .catch(() => {});
  }, []);

  if (!status?.scheduled) return null;

  function handleCancel() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/account-deletion", {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
        toast.success("Account deletion cancelled.");
        setStatus({ scheduled: false, scheduledFor: null, daysRemaining: null });
      } catch {
        toast.error("Could not cancel. Please retry.");
      }
    });
  }

  const date = status.scheduledFor ? new Date(status.scheduledFor).toLocaleDateString() : "";

  return (
    <div className="border-danger/30 bg-danger/10 sticky top-0 z-40 w-full border-b px-4 py-2">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 text-xs">
        <div className="text-foreground flex items-center gap-2">
          <AlertTriangle size={14} className="text-danger shrink-0" />
          <span>
            Your account is scheduled for deletion on <span className="font-semibold">{date}</span>
            {status.daysRemaining !== null ? ` (${status.daysRemaining} days remaining)` : ""}.
          </span>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          disabled={pending}
          className="border-border bg-background hover:bg-secondary rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-60"
        >
          {pending ? "Working…" : "Cancel deletion"}
        </button>
      </div>
    </div>
  );
}
