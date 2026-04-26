"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthNotice from "@/components/auth/AuthNotice";
import AuthSplitLayout from "@/components/layout/auth/AuthSplitLayout";
import { ControlledInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { authRoutes, getAuthErrorMessage, useForgotPassword } from "@/core/auth";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const forgotPassword = useForgotPassword();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setApiError(null);
    try {
      await forgotPassword.mutateAsync({
        email: values.email,
        cfTurnstileResponse: captchaToken || undefined,
      });
      setSubmittedEmail(values.email.trim());
    } catch (err) {
      setApiError(getAuthErrorMessage(err, "Unable to send a password reset link."));
    }
  };

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
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {apiError && <AuthNotice tone="error" message={apiError} />}

          <ControlledInput
            name="email"
            label="Email address"
            type="email"
            control={control}
            error={errors.email}
            placeholder="you@company.com"
            autoComplete="email"
          />

          <TurnstileWidget onToken={setCaptchaToken} />

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={forgotPassword.isPending}
          >
            {forgotPassword.isPending ? "Sending link..." : "Send Reset Link"}
          </Button>

          <div className="text-muted-foreground text-center text-sm">
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
