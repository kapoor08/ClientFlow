"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  sso_not_configured: "SSO is not configured for this email domain. Contact your administrator.",
  sso_discovery_failed: "Could not reach the identity provider. Try again or contact your admin.",
  state_mismatch: "SSO session expired. Please try again.",
  idp_error: "The identity provider returned an error. Contact your administrator.",
  callback_failed: "Sign-in failed during the callback. Please try again.",
  no_email: "The identity provider did not return an email address.",
  missing_params: "Invalid SSO response. Please try again.",
};

export default function SsoPage() {
  const searchParams = useSearchParams();
  const errorKey = searchParams.get("error");
  const prefillEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(prefillEmail);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    // Redirect to the initiate endpoint — the browser follows the redirect chain
    window.location.href = `/api/auth/sso/initiate?email=${encodeURIComponent(email.trim())}`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Image
              src="/app-logo.png"
              alt="ClientFlow"
              width={140}
              height={30}
              className="h-auto w-auto"
              priority
            />
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-card border border-border bg-card p-8 shadow-cf-1">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-xl font-semibold text-foreground">
              Sign in with SSO
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your work email to continue via your organization&apos;s identity provider.
            </p>
          </div>

          {errorKey && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {ERROR_MESSAGES[errorKey] ?? "An unexpected error occurred. Please try again."}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sso-email">Work email</Label>
              <Input
                id="sso-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus={!prefillEmail}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  Continue with SSO
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not using SSO?{" "}
          <Link href="/auth/sign-in" className="text-primary hover:underline">
            Sign in with password
          </Link>
        </p>
      </div>
    </div>
  );
}
