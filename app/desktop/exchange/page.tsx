"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const NONCE_PATTERN = /^[a-f0-9]{16,128}$/;

/**
 * Loaded inside Electron's BrowserWindow after the deep-link hand-off. Posts
 * the exchange token to the Better Auth desktop-exchange endpoint, which sets
 * a session cookie scoped to Electron's session, then routes to the dashboard.
 */
export default function DesktopExchangePage() {
  return (
    <Suspense fallback={<DesktopExchangeFallback />}>
      <DesktopExchangeInner />
    </Suspense>
  );
}

function DesktopExchangeFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <p className="text-muted-foreground text-sm">Signing you in…</p>
    </div>
  );
}

function DesktopExchangeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    const nonce = params.get("nonce");

    if (!token || !TOKEN_PATTERN.test(token) || !nonce || !NONCE_PATTERN.test(nonce)) {
      setError("Invalid sign-in hand-off. Please retry from the sign-in screen.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/sign-in/desktop-exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token, nonce }),
        });
        if (!res.ok) {
          const detail = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(detail?.message || "Sign-in failed.");
        }
        if (!cancelled) router.replace("/dashboard");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Sign-in failed.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        {error ? (
          <div className="space-y-3">
            <p className="text-destructive text-sm">{error}</p>
            <button
              type="button"
              onClick={() => router.replace("/auth/sign-in")}
              className="text-primary text-sm underline"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Signing you in…</p>
        )}
      </div>
    </div>
  );
}
