"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthNotice from "@/components/auth/AuthNotice";
import AuthSplitLayout from "@/components/layout/auth/AuthSplitLayout";
import { ControlledInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { authRoutes, getAuthErrorMessage, useResetPassword } from "@/core/auth";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .refine((v) => /[A-Z]/.test(v), {
        message: "Password must include at least one uppercase letter.",
      })
      .refine((v) => /[a-z]/.test(v), {
        message: "Password must include at least one lowercase letter.",
      })
      .refine((v) => /[0-9]/.test(v), {
        message: "Password must include at least one number.",
      }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const resetPassword = useResetPassword();
  const [completed, setCompleted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
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
          <Button className="w-full cursor-pointer" onClick={() => router.push(authRoutes.forgotPassword)}>
            Request New Link
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setApiError(null);
    try {
      await resetPassword.mutateAsync({ token, password: values.password });
      setCompleted(true);
    } catch (err) {
      setApiError(getAuthErrorMessage(err, "Unable to reset your password."));
    }
  };

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
          <AuthNotice tone="success" message="Your password was updated successfully." />
          <Link href={authRoutes.signIn}>
            <Button className="w-full cursor-pointer">Go to sign in</Button>
          </Link>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {apiError && <AuthNotice tone="error" message={apiError} />}

          <ControlledInput
            name="password"
            label="New Password*"
            type="password"
            control={control}
            error={errors.password}
            placeholder="Enter a new password"
            autoComplete="new-password"
            showPasswordToggle
          />

          <ControlledInput
            name="confirmPassword"
            label="Confirm Password*"
            type="password"
            control={control}
            error={errors.confirmPassword}
            placeholder="Repeat your new password"
            autoComplete="new-password"
            showPasswordToggle
          />

          <Button
            type="submit"
            className="w-full cursor-pointer"
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
