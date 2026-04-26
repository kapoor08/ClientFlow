/**
 * Cookie-consent storage + helpers.
 *
 * A single first-party cookie `cf_consent` records the user's choice across
 * three categories. Analytics / marketing scripts check `hasConsent("analytics")`
 * (etc.) before they load - until the user has explicitly opted in, they do
 * not run.
 *
 * This file is safe to import from both client and server code; the DOM-only
 * paths short-circuit during SSR.
 */

export type ConsentCategory = "essential" | "analytics" | "marketing";

export type ConsentChoice = {
  v: 1;
  essential: true; // always on - strictly-necessary cookies
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

export const CONSENT_COOKIE = "cf_consent";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year
export const CONSENT_UPDATED_EVENT = "cf:consent-updated";
export const CONSENT_OPEN_SETTINGS_EVENT = "cf:consent-open";

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

export function readConsent(): ConsentChoice | null {
  if (!isBrowser()) return null;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentChoice>;
    if (parsed.v !== 1) return null;
    return {
      v: 1,
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      ts: Number(parsed.ts) || Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeConsent(choice: Omit<ConsentChoice, "v" | "essential" | "ts">): ConsentChoice {
  const record: ConsentChoice = {
    v: 1,
    essential: true,
    analytics: Boolean(choice.analytics),
    marketing: Boolean(choice.marketing),
    ts: Date.now(),
  };
  if (isBrowser()) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(record))}; ` +
      `Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
    window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_UPDATED_EVENT, { detail: record }));
  }
  return record;
}

export function hasConsent(category: ConsentCategory): boolean {
  if (category === "essential") return true;
  const c = readConsent();
  if (!c) return false;
  return Boolean(c[category]);
}

/**
 * Programmatically reopen the consent banner - wire this to a "Manage cookies"
 * link anywhere in the app (e.g. footer, `/legal/cookies` page).
 */
export function openConsentSettings(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(CONSENT_OPEN_SETTINGS_EVENT));
}
