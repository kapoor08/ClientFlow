"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthNotice from "@/components/auth/AuthNotice";
import AuthSplitLayout from "@/components/layout/auth/AuthSplitLayout";
import { ControlledInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { authRoutes, getAuthErrorMessage, useGoogleSignIn, useSignUp } from "@/core/auth";
import { toast } from "sonner";
import GooogleIcon from "@/components/ui/google-icon";
import { captureClientEvent } from "@/lib/analytics/client";
import { FUNNEL_EVENTS } from "@/lib/analytics/events";

const signUpSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required." }),
    lastName: z.string().min(1, { message: "Last name is required." }),
    email: z.string().email({ message: "Enter a valid email address." }),
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
      })
      .refine((v) => /[^A-Za-z0-9]/.test(v), {
        message: "Password must include at least one symbol.",
      }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "";
  const signUp = useSignUp();
  const googleSignIn = useGoogleSignIn();
  const [apiError, setApiError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");

  useEffect(() => {
    captureClientEvent(FUNNEL_EVENTS.signUpStarted, {
      method: "email",
      redirectTo: redirectTo || null,
    });
  }, [redirectTo]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    setApiError(null);
    try {
      await signUp.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        callbackURL: authRoutes.signIn,
        cfTurnstileResponse: captchaToken || undefined,
      });
      captureClientEvent(FUNNEL_EVENTS.signUpDone, { method: "email" });
      toast.success("Account created. Please verify your email.");
      const verifyUrl = `${authRoutes.verifyEmail}?email=${encodeURIComponent(values.email.trim())}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ""}`;
      router.push(verifyUrl);
    } catch (err) {
      setApiError(getAuthErrorMessage(err, "Unable to create account."));
    }
  };

  async function handleGoogleSignUp() {
    setApiError(null);
    captureClientEvent(FUNNEL_EVENTS.signUpStarted, { method: "google" });
    try {
      await googleSignIn.mutateAsync(authRoutes.dashboard);
    } catch (err) {
      setApiError(getAuthErrorMessage(err, "Unable to continue with Google."));
    }
  }

  return (
    <AuthSplitLayout
      title="Create your account"
      description="Set up your agency workspace in a few minutes."
      panelTitle="Start your free trial"
      panelDescription="Create your workspace, invite your team, and begin managing projects and clients from day one."
    >
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {apiError && <AuthNotice tone="error" message={apiError} />}

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={handleGoogleSignUp}
          disabled={signUp.isPending || googleSignIn.isPending}
        >
          <GooogleIcon className="mr-2 h-4 w-4" />
          {googleSignIn.isPending ? "Redirecting..." : "Continue with Google"}
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">OR</span>
          <div className="bg-border h-px flex-1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ControlledInput
            name="firstName"
            label="First Name*"
            control={control}
            error={errors.firstName}
            placeholder="Jane"
            autoComplete="given-name"
          />
          <ControlledInput
            name="lastName"
            label="Last Name*"
            control={control}
            error={errors.lastName}
            placeholder="Doe"
            autoComplete="family-name"
          />
        </div>

        <ControlledInput
          name="email"
          label="Work email*"
          type="email"
          control={control}
          error={errors.email}
          placeholder="you@agency.com"
          autoComplete="email"
        />

        <ControlledInput
          name="password"
          label="Password*"
          type="password"
          control={control}
          error={errors.password}
          placeholder="Create a strong password"
          autoComplete="new-password"
          showPasswordToggle
        />

        <ControlledInput
          name="confirmPassword"
          label="Confirm Password*"
          type="password"
          control={control}
          error={errors.confirmPassword}
          placeholder="Repeat your password"
          autoComplete="new-password"
          showPasswordToggle
        />

        <TurnstileWidget onToken={setCaptchaToken} />

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={signUp.isPending || googleSignIn.isPending}
        >
          {signUp.isPending ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-3 text-center text-xs">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="text-muted-foreground mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link
          href={
            redirectTo
              ? `${authRoutes.signIn}?redirectTo=${encodeURIComponent(redirectTo)}`
              : authRoutes.signIn
          }
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </div>
    </AuthSplitLayout>
  );
};

export default SignUp;
