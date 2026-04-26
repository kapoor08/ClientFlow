"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CONSENT_OPEN_SETTINGS_EVENT, readConsent, writeConsent } from "@/lib/consent";

/**
 * GDPR / ePrivacy cookie consent banner.
 *
 * Renders fixed-bottom on first visit when no `cf_consent` cookie exists. Three
 * actions: Accept all, Reject non-essential, Customize (expands toggles for
 * Analytics + Marketing, essential is always on).
 *
 * Re-openable by dispatching the `cf:consent-open` event - see
 * `openConsentSettings()` in `@/lib/consent`.
 */
export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Mount + initial-state hydration. setState-in-effect is the canonical
    // pattern for hydration-safe client-only state - the alternative
    // (useSyncExternalStore) is overkill for a one-shot read of a cookie.
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    const existing = readConsent();
    if (!existing) {
      setVisible(true);
    } else {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }

    function handleOpen() {
      const current = readConsent();
      if (current) {
        setAnalytics(current.analytics);
        setMarketing(current.marketing);
      }
      setShowDetails(true);
      setVisible(true);
    }

    window.addEventListener(CONSENT_OPEN_SETTINGS_EVENT, handleOpen);
    return () => window.removeEventListener(CONSENT_OPEN_SETTINGS_EVENT, handleOpen);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!mounted || !visible) return null;

  function save(choice: { analytics: boolean; marketing: boolean }) {
    writeConsent(choice);
    setVisible(false);
    setShowDetails(false);
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-heading"
      aria-describedby="cookie-consent-body"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="border-border bg-background mx-auto max-w-3xl rounded-xl border p-5 shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h2 id="cookie-consent-heading" className="text-foreground text-sm font-semibold">
              We use cookies
            </h2>
            <p id="cookie-consent-body" className="text-muted-foreground mt-1 text-sm">
              Essential cookies keep you signed in and the app working. With your consent, we&apos;d
              also like to use analytics and marketing cookies. See our{" "}
              <Link
                href="/legal/cookies"
                className="hover:text-foreground underline underline-offset-2"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => setShowDetails((v) => !v)}
            >
              {showDetails ? "Hide" : "Customize"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => save({ analytics: false, marketing: false })}
            >
              Reject non-essential
            </Button>
            <Button
              size="sm"
              className="cursor-pointer"
              onClick={() => save({ analytics: true, marketing: true })}
            >
              Accept all
            </Button>
          </div>
        </div>

        {showDetails ? (
          <div className="border-border mt-4 space-y-3 border-t pt-4">
            <CategoryRow
              title="Essential"
              description="Required for sign-in, security, and core functionality. Cannot be disabled."
              checked
              disabled
            />
            <CategoryRow
              title="Analytics"
              description="Helps us understand how the product is used so we can improve it."
              checked={analytics}
              onChange={setAnalytics}
            />
            <CategoryRow
              title="Marketing"
              description="Used to measure campaign performance and personalize messaging."
              checked={marketing}
              onChange={setMarketing}
            />
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                className="cursor-pointer"
                onClick={() => save({ analytics, marketing })}
              >
                Save preferences
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-foreground text-sm font-medium">{title}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={`Toggle ${title.toLowerCase()} cookies`}
      />
    </div>
  );
}
