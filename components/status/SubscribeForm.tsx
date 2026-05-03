"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { toast } from "sonner";

const TURNSTILE_FIELD = "cf-turnstile-response";

/**
 * Public subscribe form for the status page. POSTs to `/api/subscribe`
 * (rewritten by middleware to `/status/api/subscribe`). On success, surfaces
 * a success message; on already-verified, surfaces a "you're already
 * subscribed" hint instead of appearing to do nothing.
 *
 * Pass `compact` when mounting inside an existing card/dialog so the form
 * doesn't render its own outer card chrome.
 */
export function SubscribeForm({ compact = false }: { compact?: boolean } = {}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState<null | "verify" | "already">(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const turnstileInput = form.elements.namedItem(TURNSTILE_FIELD) as HTMLInputElement | null;
    const turnstileToken = turnstileInput?.value ?? "";

    startTransition(async () => {
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, turnstileToken }),
        });
        const data = (await res.json()) as
          | { ok: true; alreadyVerified?: boolean }
          | { error: string };

        if (!res.ok || !("ok" in data)) {
          toast.error("error" in data ? data.error : "Could not subscribe.");
          return;
        }

        setSubmitted(data.alreadyVerified ? "already" : "verify");
        setEmail("");
      } catch {
        toast.error("Network error. Please try again.");
      }
    });
  }

  // Outer wrapper - either a card (page-mounted) or a flush container
  // (dialog-mounted). Lets the same form render in both contexts without
  // double-bordering inside the dialog.
  const Wrapper = compact ? FlushWrapper : Card;

  if (submitted === "verify") {
    return (
      <Wrapper>
        <p className="text-foreground text-sm font-medium">Check your inbox.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          We sent you a confirmation link. Click it to finish subscribing.
        </p>
      </Wrapper>
    );
  }

  if (submitted === "already") {
    return (
      <Wrapper>
        <p className="text-foreground text-sm font-medium">You&apos;re already subscribed.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          We&apos;ll email you when an incident affects ClientFlow services.
        </p>
      </Wrapper>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Wrapper>
        {/* Heading is redundant inside the dialog (DialogTitle covers it),
            so we hide it in compact mode. */}
        {!compact && (
          <>
            <h2 className="text-foreground text-base font-semibold">
              Subscribe to incident updates
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Get notified when an incident is opened, updated, or resolved.
            </p>
          </>
        )}
        <div className={`${compact ? "" : "mt-4"} flex flex-col gap-3 sm:flex-row`}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border-border bg-background text-foreground focus:ring-foreground/20 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            aria-label="Email address"
          />
          <Button type="submit" className="cursor-pointer" disabled={isPending || !email}>
            {isPending ? "Subscribing..." : "Subscribe"}
          </Button>
        </div>
        <div className="mt-3">
          <TurnstileWidget name={TURNSTILE_FIELD} />
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          We&apos;ll only email you about ClientFlow Status. Unsubscribe in one click from any
          email.
        </p>
      </Wrapper>
    </form>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="border-border bg-card rounded-xl border p-5">{children}</div>;
}

function FlushWrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
