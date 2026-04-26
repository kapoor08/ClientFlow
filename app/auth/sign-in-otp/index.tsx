"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import AuthNotice from "@/components/auth/AuthNotice";
import AuthSplitLayout from "@/components/layout/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/utils/auth-client";
import { authRoutes } from "@/core/auth";

type Stage = "request" | "verify";

const SignInOtp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || authRoutes.dashboard;

  const [stage, setStage] = useState<Stage>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp() {
    setError(null);
    if (!email) return;
    setPending(true);
    try {
      const { error: err } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });
      if (err) throw new Error(err.message ?? "Could not send code.");
      toast.success("Code sent. Check your email.");
      setStage("verify");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code.");
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp() {
    setError(null);
    if (otp.length < 6) return;
    setPending(true);
    try {
      const { error: err } = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp,
      });
      if (err) throw new Error(err.message ?? "Invalid or expired code.");
      toast.success("Signed in successfully.");
      router.push(redirectTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid or expired code.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthSplitLayout
      title={stage === "request" ? "Sign in with email code" : "Enter your code"}
      description={
        stage === "request"
          ? "We'll email you a one-time code to sign in - no password needed."
          : `Check ${email} for a 6-digit sign-in code.`
      }
      panelTitle="Welcome back"
      panelDescription="Sign in with a one-time code if your password is unavailable. Codes expire after 10 minutes."
    >
      <div className="mt-6 space-y-4">
        {error && <AuthNotice tone="error" message={error} />}

        {stage === "request" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="otp-email">Email</Label>
              <Input
                id="otp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && requestOtp()}
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
              />
            </div>
            <Button
              className="w-full cursor-pointer"
              onClick={requestOtp}
              disabled={!email || pending}
            >
              {pending ? "Sending..." : "Email me a code"}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="otp-code">Verification code</Label>
              <Input
                id="otp-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && otp.length === 6 && verifyOtp()}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                className="text-center font-mono text-lg tracking-widest"
                autoFocus
              />
            </div>
            <Button
              className="w-full cursor-pointer"
              onClick={verifyOtp}
              disabled={otp.length < 6 || pending}
            >
              {pending ? "Verifying..." : "Sign in"}
            </Button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground block w-full text-center text-xs transition-colors"
              onClick={() => {
                setStage("request");
                setOtp("");
                setError(null);
              }}
            >
              Use a different email
            </button>
          </>
        )}

        <div className="text-muted-foreground text-center text-sm">
          Remembered your password?{" "}
          <Link href={authRoutes.signIn} className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
};

export default SignInOtp;
