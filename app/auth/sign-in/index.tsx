"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthNotice from "@/components/auth/AuthNotice";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { ControlledInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  authRoutes,
  getAuthErrorMessage,
  useGoogleSignIn,
  useSignIn,
} from "@/core/auth";
import { toast } from "sonner";
import GooogleIcon from "@/assets/GoogleIcon";

const signInSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const SignIn = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || authRoutes.dashboard;

  const signIn = useSignIn();
  const googleSignIn = useGoogleSignIn();
  const [apiError, setApiError] = useState<string | null>(null);

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
      await signIn.mutateAsync({
        email: values.email,
        password: values.password,
        callbackURL: redirectTo,
      });
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

  return (
    <AuthSplitLayout
      title="Sign in"
      description="Enter your credentials to access your account."
      panelTitle="Welcome back"
      panelDescription="Sign in to manage clients, projects, billing, and your internal operations from one place."
    >
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
