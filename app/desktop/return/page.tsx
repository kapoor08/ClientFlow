"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const NONCE_PATTERN = /^[a-f0-9]{16,128}$/;

/**
 * Final stop in the system browser. Hands the exchange token back to the
 * Electron shell via the registered clientflow:// protocol, then tells the
 * user they can close the tab. A visible button is shown as a fallback in
 * case the OS blocks the implicit protocol launch.
 */
export default function DesktopReturnPage() {
  return (
    <Suspense fallback={<DesktopReturnFallback />}>
      <DesktopReturnInner />
    </Suspense>
  );
}

function DesktopReturnFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-muted-foreground text-sm">Returning to ClientFlow…</p>
    </main>
  );
}

function DesktopReturnInner() {
  const params = useSearchParams();
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const token = params.get("token");
    const nonce = params.get("nonce");

    if (!token || !TOKEN_PATTERN.test(token) || !nonce || !NONCE_PATTERN.test(nonce)) {
      setInvalid(true);
      return;
    }

    const url = `clientflow://auth?token=${encodeURIComponent(token)}&nonce=${encodeURIComponent(nonce)}`;
    setDeepLink(url);
    window.location.href = url;
  }, [params]);

  if (invalid) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-destructive text-sm">
          Invalid desktop hand-off. Please retry from the desktop app.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-medium">Returning to ClientFlow…</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        If the desktop app didn&apos;t open automatically, click the button below. You can close
        this tab once the app comes back up.
      </p>
      {deepLink && (
        <a
          href={deepLink}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
        >
          Open ClientFlow Desktop
        </a>
      )}
    </main>
  );
}
