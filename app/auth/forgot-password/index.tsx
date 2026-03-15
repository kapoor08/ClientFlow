"use client";

import Link from "next/link";
import { useState } from "react";
import AuthNotice from "@/components/auth/AuthNotice";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  authRoutes,
  getAuthErrorMessage,
  useForgotPassword,
} from "@/core/auth";

const ForgotPasswordPage = () => {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Enter the email address associated with your account.");
      return;
    }

    try {
      await forgotPassword.mutateAsync({ email });
      setSubmittedEmail(email.trim());
    } catch (currentError) {
      setError(
        getAuthErrorMessage(
          currentError,
          "Unable to send a password reset link."
        )
      );
    }
  }

  return (
    <AuthSplitLayout
      title={submittedEmail ? "Check your email" : "Reset your password"}
      description={
        submittedEmail
          ? "We sent a reset link. Open it to choose a new password."
          : "Enter your email address and we will send you a reset link."
      }
      panelTitle="Forgot your password?"
      panelDescription="Recover access to your workspace without losing your session history or account setup."
    >
      {submittedEmail ? (
        <div className="mt-6 space-y-4">
          <AuthNotice
            tone="success"
            message={`A password reset link has been prepared for ${submittedEmail}.`}
          />
          <AuthNotice
            tone="info"
            message="If email delivery is not configured yet, check the server logs for the reset URL."
          />
          <Link href={authRoutes.signIn}>
            <Button className="w-full">Back to sign in</Button>
          </Link>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error ? <AuthNotice tone="error" message={error} /> : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={forgotPassword.isPending}
          >
            {forgotPassword.isPending ? "Sending link..." : "Send Reset Link"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <Link href={authRoutes.signIn} className="text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthSplitLayout>
  );
};

export default ForgotPasswordPage;
