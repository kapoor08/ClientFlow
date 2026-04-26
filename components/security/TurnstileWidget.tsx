"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptLoadingPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve(); // graceful - widget just won't render
    document.head.appendChild(script);
  });
  return scriptLoadingPromise;
}

type Props = {
  /** Form field name. Server reads request.formData.get(name). */
  name?: string;
  /** Programmatic callback if you want the token outside a form context. */
  onToken?: (token: string) => void;
  className?: string;
};

/**
 * Cloudflare Turnstile widget. Renders nothing if NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * isn't set - that lets local development run without a Cloudflare account.
 *
 * On success, writes the token into a hidden input named `cf-turnstile-response`
 * (or whatever `name` you pass) so a plain HTML form submission picks it up
 * automatically.
 */
export function TurnstileWidget({ name = "cf-turnstile-response", onToken, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const inputId = useId();
  const { resolvedTheme } = useTheme();

  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!sitekey || !containerRef.current) return;
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey,
        theme: resolvedTheme === "dark" ? "dark" : "light",
        callback: (t) => {
          setToken(t);
          onToken?.(t);
        },
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // safe to ignore - script may have unloaded
        }
        widgetIdRef.current = null;
      }
    };
  }, [sitekey, resolvedTheme, onToken]);

  if (!sitekey) return null;

  return (
    <div className={className}>
      <div ref={containerRef} />
      <input id={inputId} type="hidden" name={name} value={token} readOnly />
    </div>
  );
}
