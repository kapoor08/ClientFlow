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
import { Input } from "@/components/ui/input";
import {
  authRoutes,
  getAuthErrorMessage,
  useGoogleSignIn,
  useSignIn,
} from "@/core/auth";
import { useMutation } from "@tanstack/react-query";
import { verifyTwoFactorCode } from "@/core/auth/repository";
import { toast } from "sonner";
import GooogleIcon from "@/components/ui/google-icon";

const signInSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const SignIn = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || authRoutes.dashboard;

  const reason = searchParams.get("reason");

  const signIn = useSignIn();
  const googleSignIn = useGoogleSignIn();
  const [apiError, setApiError] = useState<string | null>(null);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const verifyTotp = useMutation({
    mutationFn: () => verifyTwoFactorCode(totpCode),
    onSuccess: () => {
      // IP was already checked before the MFA screen was shown
      toast.success("Signed in successfully.");
      router.push(redirectTo);
    },
    onError: (err) => {
      setApiError(getAuthErrorMessage(err, "Invalid verification code."));
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setApiError(null);
    try {
      // Check if org requires SSO before attempting password auth.
      // Fall back to allowing password auth if the check itself fails -
      // a transient SSO endpoint outage shouldn't block all sign-ins.
      const ssoCheck = await fetch(
        `/api/auth/sso/check?email=${encodeURIComponent(values.email.trim())}`,
      )
        .then((r) => (r.ok ? r.json() : { ssoRequired: false }))
        .catch(() => ({ ssoRequired: false })) as { ssoRequired: boolean };

      if (ssoCheck.ssoRequired) {
        router.push(
          `/auth/sso?email=${encodeURIComponent(values.email.trim())}&reason=sso_required`,
        );
        return;
      }

      const result = await signIn.mutateAsync({
        email: values.email,
        password: values.password,
        callbackURL: redirectTo,
      });

      // Check IP allowlist immediately after credentials are verified -
      // before MFA screen or dashboard redirect - so a blocked IP never
      // progresses further in the auth flow.
      const ipCheck = await fetch(
        `/api/auth/ip-check?email=${encodeURIComponent(values.email.trim())}`,
      )
        .then((r) => r.json())
        .catch(() => ({ blocked: false })) as { blocked: boolean };

      if (ipCheck.blocked) {
        router.push("/ip-blocked");
        return;
      }

      if (result && "twoFactorRequired" in result && result.twoFactorRequired) {
        setTwoFactorRequired(true);
        return;
      }
      toast.success("Signed in successfully.");
      router.push(redirectTo);
    } catch (err) {
      setApiError(getAuthErrorMessage(err, "Unable to sign in."));
    }
  };

  async function handleGoogleSignIn() {
    setApiError(null);
    try {
      await googleSignIn.mutateAsync(redirectTo);
    } catch (err) {
      setApiError(getAuthErrorMessage(err, "Unable to continue with Google."));
    }
  }

  if (twoFactorRequired) {
    return (
      <AuthSplitLayout
        title="Two-factor authentication"
        description="Enter the 6-digit code from your authenticator app."
        panelTitle="Welcome back"
        panelDescription="Sign in to manage clients, projects, billing, and your internal operations from one place."
      >
        <div className="mt-6 space-y-4">
          {apiError && <AuthNotice tone="error" message={apiError} />}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="totp-code">
              Verification code
            </label>
            <Input
              id="totp-code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && totpCode.length === 6 && verifyTotp.mutate()}
              placeholder="000000"
              maxLength={6}
              className="text-center font-mono text-lg tracking-widest"
              autoFocus
            />
          </div>
          <Button
            className="w-full cursor-pointer"
            onClick={() => verifyTotp.mutate()}
            disabled={totpCode.length < 6 || verifyTotp.isPending}
          >
            {verifyTotp.isPending ? "Verifying..." : "Verify"}
          </Button>
          <div className="text-center">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { setTwoFactorRequired(false); setTotpCode(""); setApiError(null); }}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Sign in"
      description="Enter your credentials to access your account."
      panelTitle="Welcome back"
      panelDescription="Sign in to manage clients, projects, billing, and your internal operations from one place."
    >
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {reason === "session_expired" && (
          <AuthNotice tone="info" message="Your session has expired. Please sign in again." />
        )}
        {apiError && <AuthNotice tone="error" message={apiError} />}

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={handleGoogleSignIn}
          disabled={signIn.isPending || googleSignIn.isPending}
        >
          <GooogleIcon className="mr-2 h-4 w-4" />
          {googleSignIn.isPending ? "Redirecting..." : "Continue with Google"}
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <ControlledInput
          name="email"
          label="Email"
          type="email"
          control={control}
          error={errors.email}
          placeholder="you@company.com"
          autoComplete="email"
        />

        <ControlledInput
          name="password"
          label="Password"
          type="password"
          control={control}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
          showPasswordToggle
          labelAddon={
            <Link
              href={authRoutes.forgotPassword}
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          }
        />

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={signIn.isPending || googleSignIn.isPending}
        >
          {signIn.isPending ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={
            redirectTo && redirectTo !== authRoutes.dashboard
              ? `${authRoutes.signUp}?redirectTo=${encodeURIComponent(redirectTo)}`
              : authRoutes.signUp
          }
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </Link>
      </div>

      <div className="mt-3 text-center">
        <Link
          href="/auth/sso"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in with SSO →
        </Link>
      </div>
    </AuthSplitLayout>
  );
};

export default SignIn;
