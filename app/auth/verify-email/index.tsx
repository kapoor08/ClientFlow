"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import AuthNotice from "@/components/auth/AuthNotice";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import {
  authRoutes,
  getAuthErrorMessage,
  useResendVerificationEmail,
} from "@/core/auth";

const VerifyEmailPage = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const redirectTo = searchParams.get("redirectTo") || "";
  const resendVerificationEmail = useResendVerificationEmail();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setFeedback(null);
    setError(null);

    if (!email) {
      setError("Missing email address for verification.");
      return;
    }

    try {
      await resendVerificationEmail.mutateAsync({ email });
      setFeedback("A fresh verification link has been prepared.");
    } catch (currentError) {
      setError(
        getAuthErrorMessage(
          currentError,
          "Unable to resend the verification email."
        )
      );
    }
  }

  return (
    <AuthSplitLayout
      title="Verify your email"
      description="Check your inbox and open the verification link to activate your account."
      panelTitle="Almost there"
      panelDescription="Finish the final step so your workspace can be activated and protected."
    >
      <div className="mt-6 space-y-4">
        {email ? (
          <AuthNotice
            tone="info"
            message={`Verification email destination: ${email}`}
          />
        ) : null}
        {feedback ? <AuthNotice tone="success" message={feedback} /> : null}
        {error ? <AuthNotice tone="error" message={error} /> : null}

        <AuthNotice
          tone="info"
          message="If email delivery is not configured yet, the verification URL is logged on the server."
        />

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={handleResend}
          disabled={resendVerificationEmail.isPending}
        >
          {resendVerificationEmail.isPending
            ? "Sending..."
            : "Resend Verification Email"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <Link
            href={redirectTo ? `${authRoutes.signIn}?redirectTo=${encodeURIComponent(redirectTo)}` : authRoutes.signIn}
            className="text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
};

export default VerifyEmailPage;
