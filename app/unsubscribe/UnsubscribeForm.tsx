"use client";

import { useState, useTransition } from "react";
import { unsubscribeAction, resubscribeAction } from "./actions";

type Props = {
  token: string;
  email: string;
  initiallySuppressed: boolean;
};

export function UnsubscribeForm({ token, email, initiallySuppressed }: Props) {
  const [suppressed, setSuppressed] = useState(initiallySuppressed);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleUnsubscribe() {
    setError(null);
    startTransition(async () => {
      const result = await unsubscribeAction(token);
      if (result.ok) setSuppressed(true);
      else setError(result.error);
    });
  }

  function handleResubscribe() {
    setError(null);
    startTransition(async () => {
      const result = await resubscribeAction(token);
      if (result.ok) setSuppressed(false);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-foreground text-2xl font-semibold">
          {suppressed ? "You've been unsubscribed" : "Unsubscribe from non-essential emails"}
        </h1>
        <p className="text-muted-foreground text-sm">
          <span className="font-medium">{email}</span>
        </p>
      </div>

      {suppressed ? (
        <>
          <p className="text-muted-foreground text-sm">
            You will no longer receive product updates, task alerts, or marketing email from
            ClientFlow. You will still receive emails required to keep your account running -
            password resets, invoices, and security alerts.
          </p>
          <button
            type="button"
            onClick={handleResubscribe}
            disabled={pending}
            className="border-input bg-background hover:bg-secondary rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {pending ? "Working…" : "Resubscribe"}
          </button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Clicking the button below will stop all non-essential email to this address. You will
            still receive account-critical messages like password resets, invoices, and security
            alerts.
          </p>
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={pending}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Working…" : "Unsubscribe"}
          </button>
          <p className="text-muted-foreground text-xs">
            You can fine-tune categories in your{" "}
            <a href="/settings/notifications" className="underline underline-offset-2">
              notification settings
            </a>{" "}
            instead.
          </p>
        </>
      )}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
