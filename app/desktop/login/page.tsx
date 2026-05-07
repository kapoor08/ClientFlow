"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/utils/auth-client";

const NONCE_PATTERN = /^[a-f0-9]{16,128}$/;

export default function DesktopLoginPage() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nonce = params.get("nonce");
    if (!nonce || !NONCE_PATTERN.test(nonce)) {
      setError("Invalid desktop sign-in request. Please retry from the desktop app.");
      return;
    }

    void authClient.signIn
      .social({
        provider: "google",
        callbackURL: `/desktop/return-prep?nonce=${encodeURIComponent(nonce)}`,
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unable to start Google sign-in.");
      });
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : (
          <p className="text-muted-foreground text-sm">Redirecting to Google…</p>
        )}
      </div>
    </div>
  );
}
