"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AuthNotice from "@/components/auth/AuthNotice";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  authRoutes,
  getAuthErrorMessage,
  useResetPassword,
  validatePassword,
} from "@/core/auth";

const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const resetPassword = useResetPassword();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const resetToken = token;

  if (!resetToken) {
    return (
      <AuthSplitLayout
        title="Invalid reset link"
        description="This password reset link is missing a valid token."
        panelTitle="Set a new password"
        panelDescription="Use a fresh password reset link to continue."
      >
        <div className="mt-6 space-y-4">
          <AuthNotice
            tone="error"
            message="Request a new password reset email and use the latest link."
          />
          <Button className="w-full" onClick={() => router.push(authRoutes.forgotPassword)}>
            Request New Link
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!resetToken) {
      setError("This reset link is invalid. Request a new one.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPassword.mutateAsync({
        token: resetToken,
        password,
      });
      setCompleted(true);
    } catch (currentError) {
      setError(
        getAuthErrorMessage(currentError, "Unable to reset your password.")
      );
    }
  }

  return (
    <AuthSplitLayout
      title={completed ? "Password updated" : "Create a new password"}
      description={
        completed
          ? "Your password has been reset. Use it the next time you sign in."
          : "Choose a new password for your account."
      }
      panelTitle="Set a new password"
      panelDescription="Choose a strong password to protect your workspace and client data."
    >
      {completed ? (
        <div className="mt-6 space-y-4">
          <AuthNotice
            tone="success"
            message="Your password was updated successfully."
          />
          <Link href={authRoutes.signIn}>
            <Button className="w-full">Go to sign in</Button>
          </Link>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error ? <AuthNotice tone="error" message={error} /> : null}

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a new password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Passwords must be at least 8 characters and include uppercase,
            lowercase, and numeric characters.
          </p>

          <Button
            type="submit"
            className="w-full"
            disabled={resetPassword.isPending}
          >
            {resetPassword.isPending ? "Updating password..." : "Reset Password"}
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

export default ResetPasswordPage;
